import { NextResponse } from "next/server";
import { createTutoringAiProvider } from "@/features/tutoring/ai/provider";
import { FeedbackApiRequest, FeedbackApiResponse } from "@/features/tutoring/ai/contracts";
import { getScenarioById } from "@/features/tutoring/config/topics";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  await requireAuth();

  let body: Partial<FeedbackApiRequest>;
  try {
    body = (await request.json()) as Partial<FeedbackApiRequest>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!body.topicId || !body.scenarioId || typeof body.writtenAnswer !== "string") {
    return NextResponse.json(
      { error: "topicId, scenarioId, and writtenAnswer are required." },
      { status: 400 }
    );
  }

  const scenario = getScenarioById(body.topicId, body.scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found." }, { status: 404 });
  }

  const provider = createTutoringAiProvider();
  const feedback = await provider.getFeedback({
    topicId: body.topicId,
    scenarioId: body.scenarioId,
    scenarioPrompt: scenario.prompt,
    expectedNumericAnswer: scenario.expectedNumericAnswer,
    acceptedNumericTolerance: scenario.acceptedNumericTolerance,
    hint: scenario.hint,
    numericAnswer: typeof body.numericAnswer === "number" ? body.numericAnswer : undefined,
    writtenAnswer: body.writtenAnswer,
  });

  const response: FeedbackApiResponse = { feedback };
  return NextResponse.json(response);
}
