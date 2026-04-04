import {
  FeedbackRequest,
  FeedbackResponse,
  TutoringAiProvider,
} from "@/features/tutoring/ai/types";

/**
 * Placeholder provider for real AI mode.
 * This keeps the architecture ready for an OpenAI call without requiring it yet.
 */
export class OpenAiTutoringProvider implements TutoringAiProvider {
  constructor(private readonly apiKey: string) {}

  async getFeedback(request: FeedbackRequest): Promise<FeedbackResponse> {
    const keySuffix = this.apiKey ? "configured" : "missing";

    return {
      mode: "real",
      score: 0.6,
      numericCorrect: false,
      summary: `Real AI mode is scaffolded (${keySuffix} API key) and ready for endpoint wiring.`,
      strengths: ["Architecture is set up for swapping providers by environment."],
      improvements: [
        "Wire this provider to an OpenAI client call and map model output to the FeedbackResponse type.",
      ],
      hint: request.hint,
      recommendedNextStep: "repeat",
    };
  }
}
