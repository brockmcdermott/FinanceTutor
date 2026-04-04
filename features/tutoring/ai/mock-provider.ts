import {
  FeedbackRequest,
  FeedbackResponse,
  QuestionFeedbackResponse,
  TutoringAiProvider,
} from "@/features/tutoring/ai/types";
import { tutorRuleConfig, tutorToneConfig } from "@/features/tutoring/tutor/tuning";

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function toPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function prioritizeMisconceptions(tags: string[]) {
  const priorities = tutorToneConfig.misconceptionPriority;

  return [...new Set(tags)].sort((left, right) => {
    const leftRank = priorities.indexOf(left as (typeof priorities)[number]);
    const rightRank = priorities.indexOf(right as (typeof priorities)[number]);

    const safeLeftRank = leftRank === -1 ? 99 : leftRank;
    const safeRightRank = rightRank === -1 ? 99 : rightRank;

    return safeLeftRank - safeRightRank;
  });
}

function misconceptionReason(tag: string) {
  switch (tag) {
    case "formula_selection_error":
      return "The setup likely used the wrong relationship between the scenario values.";
    case "arithmetic_accuracy_gap":
      return "The setup seems close, but arithmetic or unit handling introduced error.";
    case "gross_vs_net_profit_confusion":
      return "Gross profit excludes overhead and taxes, while net profit includes them.";
    case "cash_vs_profit_confusion":
      return "Cash movement and accounting profit are related but not the same metric.";
    case "revenue_vs_profit_confusion":
      return "Revenue is topline before expenses; profit is what remains after costs.";
    case "weak_concept_language":
      return "The explanation needs clearer finance vocabulary tied to the concept.";
    case "limited_reasoning_depth":
      return "The reasoning is brief and could better connect assumptions to outcomes.";
    case "missing_numeric_answer":
      return "A numeric result was required before the concept can be checked.";
    case "missing_explanation":
      return "The calculation needs a short explanation of assumptions and business impact.";
    default:
      return "A core concept link is still forming; a guided retry should help.";
  }
}

function followUpQuestionForTopic(topicSlug: string) {
  switch (topicSlug) {
    case "revenue":
      return "If unit volume rises 10% while price stays constant, how does revenue change?";
    case "gross-profit":
      return "Which direct cost driver would move gross margin fastest in this scenario?";
    case "net-profit":
      return "Which expense category can you reduce first without hurting customer value?";
    case "fixed-vs-variable-expenses":
      return "How does this cost mix affect break-even risk during slower demand?";
    case "cash-flow":
      return "What policy change could improve cash timing without cutting quality?";
    case "roi":
      return "How would a lower-than-expected benefit change this investment decision?";
    case "cap-rate":
      return "How would a higher purchase price affect the same NOI-based cap rate?";
    default:
      return "What assumption in this scenario is most sensitive to change?";
  }
}

function buildQuestionFeedback(request: FeedbackRequest): QuestionFeedbackResponse[] {
  return request.evaluatedQuestions.map((question) => {
    const isCorrect = question.score >= 0.72;

    const whatWasCorrectParts: string[] = [];
    if (question.numericRequired) {
      if (question.numericCorrect === true) {
        whatWasCorrectParts.push("Your numeric setup and result are aligned with the scenario.");
      } else if (question.numericCorrect === false && question.numericDelta !== null) {
        whatWasCorrectParts.push(
          "You attempted the calculation and kept the right metric in focus."
        );
      }
    }

    if (question.explanationRequired) {
      if (question.explanationScore >= 0.65) {
        whatWasCorrectParts.push(
          "Your explanation connects the calculation to a business decision."
        );
      } else if (question.answerText.length > 0) {
        whatWasCorrectParts.push("You provided context, which is the right habit for finance work.");
      }
    }

    const misconceptionTags = prioritizeMisconceptions(question.misconceptionTags);
    const primaryMisconception = misconceptionTags[0];

    const whatWasWrong =
      isCorrect || misconceptionTags.length === 0
        ? "No major conceptual gaps in this question."
        : `Main gap: ${primaryMisconception.replaceAll("_", " ")}.`;

    const whyItWasWrong =
      isCorrect || misconceptionTags.length === 0
        ? "Your process was consistent with the target concept."
        : misconceptionReason(primaryMisconception);

    const hint =
      question.numericRequired && question.numericCorrect !== true
        ? "Write the formula in words first, then substitute each scenario value one time before calculating."
        : "Name one assumption explicitly and state how changing it would affect your result.";

    return {
      questionId: question.questionId,
      prompt: question.prompt,
      isCorrect,
      whatWasCorrect:
        whatWasCorrectParts.join(" ") ||
        "You stayed engaged and attempted the key parts of the question.",
      whatWasWrong,
      whyItWasWrong,
      hint,
      followUpQuestion: followUpQuestionForTopic(request.topicSlug),
      misconceptionTags,
    };
  });
}

export class MockTutoringAiProvider implements TutoringAiProvider {
  async getFeedback(request: FeedbackRequest): Promise<FeedbackResponse> {
    const questionFeedback = buildQuestionFeedback(request);

    const score = clamp(
      request.evaluatedQuestions.reduce((sum, question) => sum + question.score, 0) /
        Math.max(1, request.evaluatedQuestions.length)
    );

    const numericCorrect = request.evaluatedQuestions.every((question) =>
      question.numericRequired ? question.numericCorrect === true : true
    );

    const misconceptionTags = prioritizeMisconceptions(
      request.evaluatedQuestions.flatMap((question) => question.misconceptionTags)
    );

    const strengths = [
      score >= 0.8
        ? `You demonstrated strong control of ${request.topicTitle.toLowerCase()} mechanics.`
        : "You kept momentum and completed both calculation and explanation work.",
      request.evaluatedQuestions.some((question) => question.explanationScore >= 0.65)
        ? "Your written reasoning connected numbers to business meaning."
        : "You attempted reflection, which is essential for mastering finance judgment.",
    ];

    const improvements = [
      numericCorrect
        ? "Push one level deeper: stress-test your assumptions with a quick sensitivity check."
        : "Rebuild the equation line-by-line and check units before finalizing the number.",
      misconceptionTags.length > 0
        ? `Focus next on: ${misconceptionTags.slice(0, 2).join(", ").replaceAll("_", " ")}.`
        : "Use one extra sentence to explain why the formula is appropriate for this context.",
    ];

    const recommendedNextStep: FeedbackResponse["recommendedNextStep"] =
      score >= tutorRuleConfig.advanceThreshold
        ? "advance"
        : score >= tutorRuleConfig.repeatThreshold
          ? "repeat"
          : "review";

    const summary =
      score >= 0.8
        ? `Strong work. You are at ${toPercent(score)} and ready for a harder variation.`
        : score >= 0.55
          ? `Good progress at ${toPercent(score)}. Tighten one misconception and rerun a similar scenario.`
          : `You are at ${toPercent(score)}. A guided retry with hints will quickly improve accuracy.`;

    const followUpQuestion = followUpQuestionForTopic(request.topicSlug);
    const hint =
      questionFeedback.find((question) => !question.isCorrect)?.hint ??
      "Try a sensitivity check by changing one assumption and observing the directional impact.";

    return {
      mode: "mock",
      score,
      numericCorrect,
      summary,
      strengths,
      improvements,
      hint,
      followUpQuestion,
      misconceptionTags,
      questionFeedback,
      recommendedNextStep,
    };
  }
}
