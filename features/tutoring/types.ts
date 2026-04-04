export type TopicDifficulty = "foundation" | "intermediate";
export type ScenarioAnswerType = "numeric" | "written" | "mixed";

export interface FinanceScenario {
  id: string;
  topicId: string;
  title: string;
  context: string;
  prompt: string;
  answerType: ScenarioAnswerType;
  expectedNumericAnswer?: number;
  acceptedNumericTolerance?: number;
  numericLabel?: string;
  unit?: string;
  writtenPrompt: string;
  hint: string;
  conceptChecklist: string[];
  difficulty: TopicDifficulty;
}

export interface FinanceTopic {
  id: string;
  title: string;
  summary: string;
  order: number;
  tags: string[];
  scenarios: FinanceScenario[];
}

export interface LearnerSubmission {
  topicId: string;
  scenarioId: string;
  numericAnswer?: number;
  writtenAnswer: string;
}
