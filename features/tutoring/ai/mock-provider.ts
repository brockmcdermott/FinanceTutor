import {
  FeedbackRequest,
  FeedbackResponse,
  TutoringAiProvider,
} from "@/features/tutoring/ai/types";

function clampScore(value: number) {
  return Math.max(0, Math.min(1, value));
}

export class MockTutoringAiProvider implements TutoringAiProvider {
  async getFeedback(request: FeedbackRequest): Promise<FeedbackResponse> {
    const numericAnswer =
      typeof request.numericAnswer === "number" ? request.numericAnswer : undefined;
    const hasNumericAnswer = typeof numericAnswer === "number";
    const expectedNumeric = request.expectedNumericAnswer;
    const tolerance = request.acceptedNumericTolerance ?? 0;

    const numericCorrect =
      hasNumericAnswer &&
      typeof expectedNumeric === "number" &&
      Math.abs(numericAnswer - expectedNumeric) <= tolerance;

    const numericScore = hasNumericAnswer ? (numericCorrect ? 1 : 0.35) : 0.65;
    const writingLengthScore = clampScore(request.writtenAnswer.trim().length / 120);
    const writingScore = request.writtenAnswer.trim().length > 0 ? writingLengthScore : 0.1;
    const score = clampScore((numericScore * 0.7 + writingScore * 0.3));

    const recommendedNextStep =
      score >= 0.8 ? "advance" : score >= 0.55 ? "repeat" : "review";

    const summary = numericCorrect
      ? "Strong work. Your calculation is on target and your explanation is directionally sound."
      : "Good effort. Tighten the numeric calculation first, then connect the business impact in one sentence.";

    const strengths = [
      request.writtenAnswer.trim().length > 30
        ? "You gave useful business context in your written response."
        : "You submitted a response and kept momentum.",
      numericCorrect
        ? "Your core calculation matches the scenario assumptions."
        : "You attempted the core calculation, which is the right starting point.",
    ];

    const improvements = [
      numericCorrect
        ? "Add one assumption check (price, volume, or cost driver) to make your answer more robust."
        : "Rebuild the formula step-by-step and check units before the final value.",
      "Use precise finance terms such as revenue, expense, margin, and cash flow in your explanation.",
    ];

    return {
      mode: "mock",
      score,
      numericCorrect,
      summary,
      strengths,
      improvements,
      hint: request.hint,
      recommendedNextStep,
    };
  }
}
