import { EvaluatedQuestion } from "@/features/tutoring/evaluation/types";

const TOPIC_CONFUSION_PATTERNS: Record<string, Array<{ pattern: RegExp; tag: string }>> = {
  revenue: [
    { pattern: /profit|expense|cogs/, tag: "revenue_vs_profit_confusion" },
  ],
  "gross-profit": [
    { pattern: /tax|interest|net\s+profit/, tag: "gross_vs_net_profit_confusion" },
  ],
  "net-profit": [
    { pattern: /revenue\s+only|without\s+expenses/, tag: "incomplete_expense_layering" },
  ],
  "cash-flow": [
    { pattern: /profit\s*=\s*cash|same\s+as\s+profit/, tag: "cash_vs_profit_confusion" },
  ],
  roi: [
    { pattern: /revenue\s*\/\s*investment/, tag: "roi_formula_confusion" },
  ],
  "cap-rate": [
    { pattern: /rent\s*\/\s*price|revenue\s*\/\s*value/, tag: "cap_rate_input_confusion" },
  ],
};

export function detectMisconceptionTags(topicSlug: string, evaluatedQuestion: EvaluatedQuestion) {
  const tags: string[] = [];

  if (evaluatedQuestion.numeric.required) {
    if (!evaluatedQuestion.numeric.hasAnswer) {
      tags.push("missing_numeric_answer");
    } else if (evaluatedQuestion.numeric.isCorrect === false) {
      const expected = evaluatedQuestion.numeric.expectedAnswer;
      const answer = evaluatedQuestion.numeric.answer;
      const delta = evaluatedQuestion.numeric.delta;

      if (
        typeof expected === "number" &&
        typeof answer === "number" &&
        Math.sign(expected) !== 0 &&
        Math.sign(answer) !== 0 &&
        Math.sign(expected) !== Math.sign(answer)
      ) {
        tags.push("sign_error");
      }

      if (typeof expected === "number" && typeof delta === "number") {
        const relativeError = delta / Math.max(Math.abs(expected), 1);
        if (relativeError > 0.4) {
          tags.push("formula_selection_error");
        } else {
          tags.push("arithmetic_accuracy_gap");
        }
      }
    }
  }

  if (evaluatedQuestion.explanation.required) {
    if (!evaluatedQuestion.explanation.hasAnswer) {
      tags.push("missing_explanation");
    } else {
      if (evaluatedQuestion.explanation.lengthScore < 0.3) {
        tags.push("limited_reasoning_depth");
      }

      if (evaluatedQuestion.explanation.keywordScore < 0.45) {
        tags.push("weak_concept_language");
      }

      const lowerAnswer = evaluatedQuestion.explanation.answer.toLowerCase();
      const patterns = TOPIC_CONFUSION_PATTERNS[topicSlug] ?? [];

      patterns.forEach((rule) => {
        if (rule.pattern.test(lowerAnswer)) {
          tags.push(rule.tag);
        }
      });
    }
  }

  return Array.from(new Set(tags));
}
