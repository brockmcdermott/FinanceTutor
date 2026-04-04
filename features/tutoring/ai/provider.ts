import { MockTutoringAiProvider } from "@/features/tutoring/ai/mock-provider";
import { OpenAiTutoringProvider } from "@/features/tutoring/ai/openai-provider";
import { TutoringAiMode, TutoringAiProvider } from "@/features/tutoring/ai/types";

const DEFAULT_MODE: TutoringAiMode = "mock";

export function getTutoringAiMode(): TutoringAiMode {
  const configured = process.env.TUTORING_AI_MODE?.toLowerCase();
  return configured === "real" ? "real" : DEFAULT_MODE;
}

export function createTutoringAiProvider(mode = getTutoringAiMode()): TutoringAiProvider {
  if (mode === "real") {
    return new OpenAiTutoringProvider(process.env.OPENAI_API_KEY ?? "");
  }

  return new MockTutoringAiProvider();
}
