"use client";

import { FinanceScenario } from "@/features/tutoring/types";
import { useEffect, useState } from "react";

interface AnswerFormValues {
  numericAnswer?: number;
  writtenAnswer: string;
}

export function AnswerForm({
  scenario,
  onSubmit,
  disabled = false,
}: {
  scenario: FinanceScenario;
  onSubmit: (values: AnswerFormValues) => Promise<void>;
  disabled?: boolean;
}) {
  const [numericInput, setNumericInput] = useState("");
  const [writtenInput, setWrittenInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const needsNumeric = scenario.answerType !== "written";
  const needsWritten = scenario.answerType !== "numeric";

  useEffect(() => {
    setNumericInput("");
    setWrittenInput("");
    setError(null);
  }, [scenario.id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedWritten = writtenInput.trim();
    if (needsWritten && trimmedWritten.length < 8) {
      setError("Add at least one clear finance-focused sentence in your written answer.");
      return;
    }

    let numericAnswer: number | undefined;
    if (needsNumeric) {
      if (!numericInput.trim()) {
        setError("Enter a numeric answer before submitting.");
        return;
      }

      const parsed = Number(numericInput.replace(/,/g, ""));
      if (Number.isNaN(parsed)) {
        setError("Numeric answer must be a valid number.");
        return;
      }
      numericAnswer = parsed;
    }

    setError(null);
    await onSubmit({
      numericAnswer,
      writtenAnswer: trimmedWritten,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <h3 className="text-lg font-semibold text-slate-900">Your Answer</h3>

      <div className="mt-4 space-y-4">
        {needsNumeric && (
          <label className="block text-sm font-medium text-slate-700">
            {scenario.numericLabel ?? "Numeric answer"}
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={numericInput}
                onChange={(event) => setNumericInput(event.target.value)}
                placeholder={scenario.unit === "%" ? "e.g. 23" : "e.g. 12000"}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none ring-0 transition focus:border-slate-500"
              />
              {scenario.unit && (
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {scenario.unit}
                </span>
              )}
            </div>
          </label>
        )}

        {needsWritten && (
          <label className="block text-sm font-medium text-slate-700">
            Reasoning
            <textarea
              value={writtenInput}
              onChange={(event) => setWrittenInput(event.target.value)}
              rows={4}
              placeholder="Explain your assumptions and business reasoning."
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none ring-0 transition focus:border-slate-500"
            />
          </label>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={disabled}
        className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {disabled ? "Scoring..." : "Submit answer"}
      </button>
    </form>
  );
}
