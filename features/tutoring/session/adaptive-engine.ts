export function getNextScenarioIndex(
  currentIndex: number,
  totalScenarios: number,
  score: number
): number {
  if (totalScenarios <= 1) {
    return 0;
  }

  if (score >= 0.8) {
    return Math.min(currentIndex + 1, totalScenarios - 1);
  }

  if (score < 0.55) {
    return Math.max(currentIndex - 1, 0);
  }

  return currentIndex;
}
