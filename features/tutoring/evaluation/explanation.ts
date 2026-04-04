import { ScenarioQuestionRecord } from "@/features/tutoring/data/types";
import { ExplanationEvaluation } from "@/features/tutoring/evaluation/types";

const TOPIC_KEYWORDS: Record<string, string[]> = {
  revenue: ["revenue", "price", "volume", "units", "sales"],
  "gross-profit": ["gross", "cost", "cogs", "margin", "revenue"],
  "net-profit": ["net", "expense", "tax", "profit", "operating"],
  "fixed-vs-variable-expenses": ["fixed", "variable", "cost", "break-even", "leverage"],
  "cash-flow": ["cash", "inflow", "outflow", "liquidity", "ending"],
  roi: ["roi", "return", "investment", "benefit", "payback"],
  "cap-rate": ["cap", "noi", "property", "yield", "valuation"],
};

const REASONING_MARKERS = ["because", "therefore", "so", "since", "if", "which means"];

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function isExplanationRequired(responseFormat: ScenarioQuestionRecord["responseFormat"]) {
  return responseFormat === "short_text" || responseFormat === "mixed";
}

export function evaluateExplanation(
  question: ScenarioQuestionRecord,
  topicSlug: string,
  shortTextAnswer: string | null | undefined
): ExplanationEvaluation {
  const required = isExplanationRequired(question.responseFormat);

  if (!required) {
    return {
      required: false,
      hasAnswer: false,
      answer: "",
      lengthScore: 1,
      keywordScore: 1,
      reasoningScore: 1,
      score: 1,
    };
  }

  const answer = (shortTextAnswer ?? "").trim();
  const lower = answer.toLowerCase();
  const hasAnswer = answer.length > 0;

  if (!hasAnswer) {
    return {
      required: true,
      hasAnswer: false,
      answer,
      lengthScore: 0,
      keywordScore: 0,
      reasoningScore: 0,
      score: 0,
    };
  }

  const lengthScore = clamp(answer.length / 180);

  const keywords = TOPIC_KEYWORDS[topicSlug] ?? ["cost", "revenue", "profit", "cash"];
  const matchedKeywordCount = keywords.filter((keyword) => lower.includes(keyword)).length;
  const keywordScore = clamp(matchedKeywordCount / Math.max(2, keywords.length * 0.5));

  const reasoningMarkerCount = REASONING_MARKERS.filter((marker) => lower.includes(marker)).length;
  const reasoningScore = clamp(reasoningMarkerCount > 0 ? 1 : 0.45);

  const score = clamp(lengthScore * 0.4 + keywordScore * 0.35 + reasoningScore * 0.25);

  return {
    required: true,
    hasAnswer,
    answer,
    lengthScore,
    keywordScore,
    reasoningScore,
    score,
  };
}
