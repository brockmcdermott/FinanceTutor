# How To Demo This Project

## 1. Suggested Demo Flow (8-10 minutes)

1. Open `/dashboard`
   - Show welcome area, progress snapshot, topic overview, recent activity.
2. Open `/practice`
   - Pick a topic and walk through one scenario.
   - Request hint level 1, then hint level 2 for one question.
3. Submit one intentionally weak answer
   - Highlight feedback quality and misconception tags.
   - Show adaptive recommendation strategy (`scaffold`/`remediation`).
4. Submit a stronger follow-up answer
   - Show recommendation shifting toward `reinforce` or `advance`.
5. Open `/progress`
   - Show topic mastery cards, trend indicator, weak areas to review.
6. Open `/settings`
   - Explain mock-vs-real AI mode and fallback safety.

## 2. What To Show First

- Dashboard hero + continue-learning CTA
- Practice flow (scenario -> answer -> feedback -> adaptive next step)
- Progress dashboard (why adaptation is measurable, not random)

## 3. Where AI Is Used

- AI generates instructional coaching text:
  - summary
  - strengths/improvements
  - question-level explanation feedback
  - hints/follow-up guidance language
- Deterministic logic still handles numeric grading, misconception tagging, and sequencing decisions.

## 4. Where Adaptation Is Visible

- In practice results:
  - `adaptiveRecommendation.strategy` (`remediation`, `scaffold`, `reinforce`, `advance`)
  - rationale text and next topic/scenario suggestion
- In progress page:
  - mastery confidence per topic
  - trend direction
  - weak skills and recurring misconception tags

## 5. Demo Scripts (Quick Talking Points)

- "This tutor checks both the number and the explanation."
- "If the learner repeats a misconception, remediation is prioritized automatically."
- "If performance improves, the sequencing engine advances difficulty or shifts to adjacent skills."
- "Even if real AI fails, the app falls back to polished mock feedback so the demo remains stable."
