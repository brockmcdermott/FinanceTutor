"use client";

import { useEffect, useMemo, useState } from "react";
import { HintApiResponse, SubmittedAnswerPayload } from "@/features/tutoring/ai/contracts";
import { HintPanel } from "@/features/tutoring/components/hint-panel";
import { ScenarioQuestionRecord, ScenarioRecord } from "@/features/tutoring/data/types";
import { tutorRuleConfig } from "@/features/tutoring/tutor/tuning";

interface QuestionDraftState {
  numericInput: string;
  shortTextInput: string;
  hintLevel: number;
  hintText: string | null;
}

function parseNumericInput(raw: string) {
  const normalized = raw.replace(/,/g, "").trim();
  if (normalized.length === 0) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function requiresNumeric(question: ScenarioQuestionRecord) {
  return question.responseFormat === "numeric" || question.responseFormat === "mixed";
}

function requiresExplanation(question: ScenarioQuestionRecord) {
  return question.responseFormat === "short_text" || question.responseFormat === "mixed";
}

function buildInitialDrafts(scenario: ScenarioRecord): Record<string, QuestionDraftState> {
  return scenario.questions.reduce<Record<string, QuestionDraftState>>((accumulator, question) => {
    accumulator[question.id] = {
      numericInput: "",
      shortTextInput: "",
      hintLevel: 0,
      hintText: null,
    };
    return accumulator;
  }, {});
}

export function AnswerForm({
  scenario,
  disabled = false,
  onSubmit,
  onRequestHint,
}: {
  scenario: ScenarioRecord;
  disabled?: boolean;
  onSubmit: (answers: SubmittedAnswerPayload[]) => Promise<void>;
  onRequestHint: (params: {
    questionId: string;
    requestedHintLevel: number;
  }) => Promise<HintApiResponse>;
}) {
  const initialDrafts = useMemo(() => buildInitialDrafts(scenario), [scenario]);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hintLoadingByQuestion, setHintLoadingByQuestion] = useState<Record<string, boolean>>({});
  const [hintErrorByQuestion, setHintErrorByQuestion] = useState<Record<string, string>>({});

  useEffect(() => {
    setDrafts(initialDrafts);
    setValidationErrors({});
    setHintLoadingByQuestion({});
    setHintErrorByQuestion({});
  }, [initialDrafts]);

  const setQuestionDraft = (
    questionId: string,
    updater: (draft: QuestionDraftState) => QuestionDraftState
  ) => {
    setDrafts((current) => ({
      ...current,
      [questionId]: updater(current[questionId] ?? initialDrafts[questionId]),
    }));
  };

  const handleHintRequest = async (questionId: string) => {
    const draft = drafts[questionId] ?? initialDrafts[questionId];
    const requestedHintLevel = Math.min(2, Math.max(1, draft.hintLevel + 1));

    setHintLoadingByQuestion((current) => ({ ...current, [questionId]: true }));
    setHintErrorByQuestion((current) => ({ ...current, [questionId]: "" }));

    try {
      const response = await onRequestHint({ questionId, requestedHintLevel });
      setQuestionDraft(questionId, (currentDraft) => ({
        ...currentDraft,
        hintLevel: response.hintLevel,
        hintText: response.hint,
      }));
    } catch (error) {
      setHintErrorByQuestion((current) => ({
        ...current,
        [questionId]:
          error instanceof Error ? error.message : "Unable to load a hint for this question.",
      }));
    } finally {
      setHintLoadingByQuestion((current) => ({ ...current, [questionId]: false }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const answers: SubmittedAnswerPayload[] = [];

    scenario.questions.forEach((question) => {
      const draft = drafts[question.id] ?? initialDrafts[question.id];
      const numericRequired = requiresNumeric(question);
      const explanationRequired = requiresExplanation(question);
      let numericAnswer: number | null = null;

      if (numericRequired) {
        const parsed = parseNumericInput(draft.numericInput);
        if (parsed === null) {
          nextErrors[question.id] = "Enter a numeric answer before submitting.";
        } else if (Number.isNaN(parsed)) {
          nextErrors[question.id] = "Numeric answers must be valid numbers.";
        } else {
          numericAnswer = parsed;
        }
      }

      const shortTextAnswer = draft.shortTextInput.trim();
      if (
        explanationRequired &&
        shortTextAnswer.length < tutorRuleConfig.explanationMinimumCharacters
      ) {
        nextErrors[question.id] = `Write at least ${tutorRuleConfig.explanationMinimumCharacters} characters explaining your reasoning.`;
      }

      answers.push({
        questionId: question.id,
        numericAnswer,
        shortTextAnswer: explanationRequired ? shortTextAnswer : null,
        hintLevel: draft.hintLevel,
      });
    });

    setValidationErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit(answers);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <h3 className="text-lg font-semibold text-slate-900">Question set</h3>
      <p className="mt-1 text-sm text-slate-600">
        Submit each numeric result and short explanation so the tutor can coach both accuracy and
        reasoning.
      </p>

      <div className="mt-5 space-y-4">
        {scenario.questions.map((question, index) => {
          const draft = drafts[question.id] ?? initialDrafts[question.id];
          const numericRequired = requiresNumeric(question);
          const explanationRequired = requiresExplanation(question);
          const validationError = validationErrors[question.id];
          const hintError = hintErrorByQuestion[question.id];
          const isHintLoading = Boolean(hintLoadingByQuestion[question.id]);

          return (
            <article
              key={question.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Question {index + 1}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-900">{question.prompt}</p>

              <div className="mt-4 space-y-3">
                {numericRequired && (
                  <label className="block text-sm font-medium text-slate-700">
                    Numeric answer
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={draft.numericInput}
                        onChange={(event) =>
                          setQuestionDraft(question.id, (current) => ({
                            ...current,
                            numericInput: event.target.value,
                          }))
                        }
                        placeholder={question.unit === "%" ? "e.g. 18.4" : "e.g. 12450"}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                      />
                      {question.unit && (
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          {question.unit}
                        </span>
                      )}
                    </div>
                  </label>
                )}

                {explanationRequired && (
                  <label className="block text-sm font-medium text-slate-700">
                    Explanation
                    <textarea
                      value={draft.shortTextInput}
                      onChange={(event) =>
                        setQuestionDraft(question.id, (current) => ({
                          ...current,
                          shortTextInput: event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder={
                        question.explanationPrompt ??
                        "Explain why your formula fits this scenario and what the result means."
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                    />
                  </label>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleHintRequest(question.id)}
                  disabled={disabled || isHintLoading}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isHintLoading
                    ? "Loading hint..."
                    : draft.hintLevel === 0
                      ? "Get hint"
                      : draft.hintLevel === 1
                        ? "Get second hint"
                        : "Refresh hint"}
                </button>
                {draft.hintLevel > 0 && (
                  <span className="text-xs font-medium text-slate-500">Hint level {draft.hintLevel}/2</span>
                )}
              </div>

              {draft.hintText && (
                <div className="mt-3">
                  <HintPanel hint={draft.hintText} hintLevel={draft.hintLevel} />
                </div>
              )}

              {hintError && <p className="mt-2 text-sm text-rose-600">{hintError}</p>}
              {validationError && <p className="mt-2 text-sm text-rose-600">{validationError}</p>}
            </article>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {disabled ? "Submitting..." : "Submit answers"}
      </button>
    </form>
  );
}
