import { NextResponse } from "next/server";
import { HintApiRequest, HintApiResponse } from "@/features/tutoring/ai/contracts";
import { fetchScenarioById } from "@/features/tutoring/data/server";
import { buildInstructionalHint } from "@/features/tutoring/evaluation/hints";
import { requireAuth } from "@/lib/auth";

function normalizeHintRequest(level: number | null | undefined) {
  if (typeof level !== "number" || Number.isNaN(level)) {
    return 1;
  }

  return Math.min(2, Math.max(1, Math.trunc(level)));
}

export async function POST(request: Request) {
  await requireAuth();

  let body: Partial<HintApiRequest>;
  try {
    body = (await request.json()) as Partial<HintApiRequest>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (
    typeof body.scenarioId !== "string" ||
    body.scenarioId.trim().length === 0 ||
    typeof body.questionId !== "string" ||
    body.questionId.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "scenarioId and questionId are required." },
      { status: 400 }
    );
  }

  const scenario = await fetchScenarioById(body.scenarioId);
  const question = scenario?.questions.find((item) => item.id === body.questionId) ?? null;

  if (!scenario || !question) {
    return NextResponse.json(
      { error: "Scenario or question was not found." },
      { status: 404 }
    );
  }

  const { level, hint } = buildInstructionalHint({
    question,
    topicTitle: scenario.topic.title,
    requestedLevel: normalizeHintRequest(body.hintLevel),
  });

  const response: HintApiResponse = {
    questionId: question.id,
    hintLevel: level,
    hint,
  };

  return NextResponse.json(response);
}
