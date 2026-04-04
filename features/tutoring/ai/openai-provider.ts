import {
  FeedbackRequest,
  FeedbackResponse,
  QuestionFeedbackResponse,
  TutoringAiProvider,
} from "@/features/tutoring/ai/types";
import { MockTutoringAiProvider } from "@/features/tutoring/ai/mock-provider";

interface OpenAiMessage {
  role: "system" | "user";
  content: string;
}

interface OpenAiChatCompletionRequest {
  model: string;
  temperature: number;
  response_format?: { type: "json_object" };
  messages: OpenAiMessage[];
}

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const DEFAULT_TIMEOUT_MS = 15000;

type FallbackReason =
  | "missing_key"
  | "rate_limited"
  | "api_error"
  | "malformed_response";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function toStringArray(value: unknown, fallback: string[], minItems = 1) {
  const normalized = Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

  if (normalized.length >= minItems) {
    return normalized;
  }

  return fallback;
}

function toStringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function sanitizeQuestionFeedback({
  request,
  parsed,
  fallback,
}: {
  request: FeedbackRequest;
  parsed: unknown;
  fallback: QuestionFeedbackResponse[];
}) {
  const parsedRows = Array.isArray(parsed) ? parsed : [];
  const parsedById = new Map<string, Record<string, unknown>>();
  parsedRows.forEach((row) => {
    if (!isRecord(row) || typeof row.questionId !== "string") {
      return;
    }
    parsedById.set(row.questionId, row);
  });

  const fallbackById = new Map(fallback.map((row) => [row.questionId, row]));

  return request.evaluatedQuestions.map((question) => {
    const parsedRow = parsedById.get(question.questionId);
    const fallbackRow = fallbackById.get(question.questionId);

    if (!parsedRow || !fallbackRow) {
      return (
        fallbackRow ?? {
          questionId: question.questionId,
          prompt: question.prompt,
          isCorrect: question.score >= 0.72,
          whatWasCorrect: "You attempted the key parts of this question.",
          whatWasWrong: "A few concept links still need reinforcement.",
          whyItWasWrong: "The explanation should connect formula choice to business meaning.",
          hint: "Write the formula in words, then map each scenario number to that formula.",
          followUpQuestion:
            "Which assumption would change your answer most if it moved by 10%?",
          misconceptionTags: question.misconceptionTags,
        }
      );
    }

    return {
      questionId: question.questionId,
      prompt: question.prompt,
      isCorrect: typeof parsedRow.isCorrect === "boolean" ? parsedRow.isCorrect : fallbackRow.isCorrect,
      whatWasCorrect: toStringValue(parsedRow.whatWasCorrect, fallbackRow.whatWasCorrect),
      whatWasWrong: toStringValue(parsedRow.whatWasWrong, fallbackRow.whatWasWrong),
      whyItWasWrong: toStringValue(parsedRow.whyItWasWrong, fallbackRow.whyItWasWrong),
      hint: toStringValue(parsedRow.hint, fallbackRow.hint),
      followUpQuestion: toStringValue(parsedRow.followUpQuestion, fallbackRow.followUpQuestion),
      misconceptionTags: toStringArray(
        parsedRow.misconceptionTags,
        fallbackRow.misconceptionTags,
        0
      ),
    } satisfies QuestionFeedbackResponse;
  });
}

function extractMessageContent(payload: unknown) {
  if (!isRecord(payload)) {
    return null;
  }

  const choices = payload.choices;
  if (!Array.isArray(choices) || choices.length === 0 || !isRecord(choices[0])) {
    return null;
  }

  const message = choices[0].message;
  if (!isRecord(message)) {
    return null;
  }

  const content = message.content;
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const textEntry = content.find((entry) => isRecord(entry) && typeof entry.text === "string");
    if (isRecord(textEntry) && typeof textEntry.text === "string") {
      return textEntry.text;
    }
  }

  return null;
}

function parseTimeoutMs() {
  const parsed = Number(process.env.OPENAI_TIMEOUT_MS);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return Math.round(parsed);
}

function buildSystemPrompt() {
  return [
    "You are a supportive business finance tutor.",
    "Respond with valid JSON only. Do not include markdown or prose outside JSON.",
    "Focus on instructional feedback, misconceptions, and next-step guidance.",
    "Avoid shaming language. Be concise and specific.",
    "Use this JSON shape exactly:",
    "{",
    '  "summary": "string",',
    '  "strengths": ["string"],',
    '  "improvements": ["string"],',
    '  "hint": "string",',
    '  "followUpQuestion": "string",',
    '  "questionFeedback": [',
    "    {",
    '      "questionId": "string",',
    '      "isCorrect": true,',
    '      "whatWasCorrect": "string",',
    '      "whatWasWrong": "string",',
    '      "whyItWasWrong": "string",',
    '      "hint": "string",',
    '      "followUpQuestion": "string",',
    '      "misconceptionTags": ["string"]',
    "    }",
    "  ]",
    "}",
  ].join("\n");
}

function buildUserPrompt(request: FeedbackRequest) {
  return JSON.stringify(
    {
      topic: {
        slug: request.topicSlug,
        title: request.topicTitle,
      },
      scenario: {
        id: request.scenarioId,
        title: request.scenarioTitle,
        context: request.scenarioContext,
      },
      evaluatedQuestions: request.evaluatedQuestions,
      instruction:
        "Generate targeted tutoring feedback that identifies what was correct, what was wrong, and why. Include one practical hint and one follow-up question.",
    },
    null,
    2
  );
}

function fallbackPrefix(reason: FallbackReason) {
  switch (reason) {
    case "missing_key":
      return "OPENAI_API_KEY is missing. Using mock tutor feedback.";
    case "rate_limited":
      return "OpenAI rate limit reached. Using mock tutor feedback.";
    case "api_error":
      return "OpenAI request failed. Using mock tutor feedback.";
    case "malformed_response":
      return "OpenAI response was malformed. Using mock tutor feedback.";
    default:
      return "Using mock tutor feedback.";
  }
}

function createFallbackFeedback({
  fallback,
  reason,
}: {
  fallback: FeedbackResponse;
  reason: FallbackReason;
}) {
  return {
    ...fallback,
    mode: "mock",
    summary: `${fallbackPrefix(reason)} ${fallback.summary}`,
  } satisfies FeedbackResponse;
}

export class OpenAiTutoringProvider implements TutoringAiProvider {
  constructor(private readonly apiKey: string) {}

  private async callOpenAiApi(
    request: FeedbackRequest
  ): Promise<Record<string, unknown> | null> {
    const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
    const baseUrl = process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1";
    const timeoutMs = parseTimeoutMs();
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    const payload: OpenAiChatCompletionRequest = {
      model,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: buildUserPrompt(request),
        },
      ],
    };

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (response.status === 429) {
        throw new Error("rate_limited");
      }

      if (!response.ok) {
        throw new Error("api_error");
      }

      const json = (await response.json()) as unknown;
      return isRecord(json) ? json : null;
    } catch (error) {
      if (error instanceof Error && error.message === "rate_limited") {
        throw new Error("rate_limited");
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("api_error");
      }

      throw new Error("api_error");
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private buildRealFeedbackFromPayload({
    request,
    payload,
    fallback,
  }: {
    request: FeedbackRequest;
    payload: Record<string, unknown>;
    fallback: FeedbackResponse;
  }): FeedbackResponse {
    const content = extractMessageContent(payload);
    if (!content) {
      throw new Error("malformed_response");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("malformed_response");
    }

    if (!isRecord(parsed)) {
      throw new Error("malformed_response");
    }

    const questionFeedback = sanitizeQuestionFeedback({
      request,
      parsed: parsed.questionFeedback,
      fallback: fallback.questionFeedback,
    });

    const inferredMisconceptionTags = Array.from(
      new Set(questionFeedback.flatMap((row) => row.misconceptionTags))
    );

    return {
      ...fallback,
      mode: "real",
      summary: toStringValue(parsed.summary, fallback.summary),
      strengths: toStringArray(parsed.strengths, fallback.strengths, 1),
      improvements: toStringArray(parsed.improvements, fallback.improvements, 1),
      hint: toStringValue(parsed.hint, fallback.hint),
      followUpQuestion: toStringValue(parsed.followUpQuestion, fallback.followUpQuestion),
      questionFeedback,
      misconceptionTags:
        inferredMisconceptionTags.length > 0
          ? inferredMisconceptionTags
          : fallback.misconceptionTags,
      score: clamp(fallback.score),
      numericCorrect: fallback.numericCorrect,
      recommendedNextStep: fallback.recommendedNextStep,
    } satisfies FeedbackResponse;
  }

  async getFeedback(request: FeedbackRequest): Promise<FeedbackResponse> {
    const mockProvider = new MockTutoringAiProvider();
    const mockFeedback = await mockProvider.getFeedback(request);

    if (!this.apiKey.trim()) {
      return createFallbackFeedback({
        fallback: mockFeedback,
        reason: "missing_key",
      });
    }

    try {
      const payload = await this.callOpenAiApi(request);
      if (!payload) {
        return createFallbackFeedback({
          fallback: mockFeedback,
          reason: "malformed_response",
        });
      }

      return this.buildRealFeedbackFromPayload({
        request,
        payload,
        fallback: mockFeedback,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "rate_limited") {
        return createFallbackFeedback({
          fallback: mockFeedback,
          reason: "rate_limited",
        });
      }

      if (error instanceof Error && error.message === "malformed_response") {
        return createFallbackFeedback({
          fallback: mockFeedback,
          reason: "malformed_response",
        });
      }

      return createFallbackFeedback({
        fallback: mockFeedback,
        reason: "api_error",
      });
    }
  }
}
