import {
  FeedbackRequest,
  FeedbackResponse,
  TutoringAiProvider,
} from "@/features/tutoring/ai/types";
import { MockTutoringAiProvider } from "@/features/tutoring/ai/mock-provider";

/**
 * Placeholder provider for real AI mode.
 * For now it mirrors the mock structure with "real" mode metadata,
 * which keeps the app demo-ready while API integration is pending.
 */
export class OpenAiTutoringProvider implements TutoringAiProvider {
  constructor(private readonly apiKey: string) {}

  async getFeedback(request: FeedbackRequest): Promise<FeedbackResponse> {
    const fallback = new MockTutoringAiProvider();
    const mockFeedback = await fallback.getFeedback(request);

    if (!this.apiKey.trim()) {
      return {
        ...mockFeedback,
        mode: "mock",
        summary:
          "OPENAI_API_KEY is missing, so mock tutoring feedback was used for a reliable demo flow.",
      };
    }

    return {
      ...mockFeedback,
      mode: "real",
      summary:
        "Real AI mode is scaffolded. Plug your OpenAI client call into this provider to replace mock-generated coaching text.",
      improvements: [
        ...mockFeedback.improvements,
        "Connect this provider to OpenAI and map model output to the existing FeedbackResponse schema.",
      ],
    };
  }
}
