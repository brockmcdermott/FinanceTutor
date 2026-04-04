import { ScenarioQuestionRecord } from "@/features/tutoring/data/types";

function normalizeHintLevel(level: number | null | undefined) {
  if (!level || Number.isNaN(level)) {
    return 1;
  }

  return Math.min(2, Math.max(1, Math.trunc(level)));
}

export function buildInstructionalHint({
  question,
  topicTitle,
  requestedLevel,
}: {
  question: ScenarioQuestionRecord;
  topicTitle: string;
  requestedLevel?: number | null;
}) {
  const level = normalizeHintLevel(requestedLevel);
  const baseHint = question.hint?.trim();

  if (question.responseFormat === "short_text") {
    if (level === 1) {
      return {
        level,
        hint: `Start with cause-and-effect language for ${topicTitle}. State one driver, then explain how it changes the outcome.`,
      };
    }

    return {
      level,
      hint:
        "More direct: use this sentence frame: 'Because [driver] changed, [financial metric] moved by [direction], which affects [business impact].'",
    };
  }

  if (level === 1) {
    return {
      level,
      hint:
        baseHint ??
        "Start by writing the formula in words, plug in each known value, and keep units consistent before doing arithmetic.",
    };
  }

  const directGuide = baseHint
    ? `More direct: ${baseHint}`
    : "More direct: set up each term explicitly, substitute the scenario numbers once, then solve step-by-step.";

  const unitGuide = question.unit ? ` Report your answer in ${question.unit}.` : "";

  return {
    level,
    hint: `${directGuide}${unitGuide}`,
  };
}
