import { MockTutoringAiProvider } from "@/features/tutoring/ai/mock-provider";
import { OpenAiTutoringProvider } from "@/features/tutoring/ai/openai-provider";
import { TutoringAiMode, TutoringAiProvider } from "@/features/tutoring/ai/types";

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function isLegacyRealModeRequested() {
  return process.env.TUTORING_AI_MODE?.toLowerCase() === "real";
}

export function isMockAiEnabled() {
  const fallback = !isLegacyRealModeRequested();
  return parseBoolean(process.env.MOCK_AI, fallback);
}

export function getTutoringAiMode(): TutoringAiMode {
  const openAiKey = process.env.OPENAI_API_KEY?.trim();

  if (!isMockAiEnabled() && openAiKey) {
    return "real";
  }

  return "mock";
}

export function getTutoringAiRuntimeStatus() {
  const mockEnabled = isMockAiEnabled();
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  const mode = getTutoringAiMode();

  const fallbackReason =
    mode === "mock" && !mockEnabled && !hasOpenAiKey
      ? "MOCK_AI is false but OPENAI_API_KEY is missing, so the tutor falls back to mock mode."
      : null;

  return {
    mode,
    mockEnabled,
    hasOpenAiKey,
    fallbackReason,
  };
}

export function createTutoringAiProvider(mode = getTutoringAiMode()): TutoringAiProvider {
  if (mode === "real") {
    return new OpenAiTutoringProvider(process.env.OPENAI_API_KEY ?? "");
  }

  return new MockTutoringAiProvider();
}
