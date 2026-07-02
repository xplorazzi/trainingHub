"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { ModuleStepper } from "@/components/layout/module-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  clearPendingQuiz,
  loadPendingQuiz,
  pendingToAnswerMap,
  savePendingQuiz,
  type PendingQuizAnswer,
} from "@/lib/quiz-pending";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
}

export function QuizClient({
  moduleId,
  title,
  questions,
  durationMins,
}: {
  moduleId: string;
  title: string;
  questions: QuizQuestion[];
  durationMins: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeHandled = useRef(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [resuming, setResuming] = useState(false);

  const current = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isLast = currentIndex === questions.length - 1;

  function buildAnswerPayload(): PendingQuizAnswer[] {
    return questions.map((q) => ({
      questionId: q.id,
      selectedIndex: answers[q.id] ?? -1,
    }));
  }

  async function submitAnswers(payload: PendingQuizAnswer[]) {
    const res = await fetch(`/api/modules/${moduleId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: payload }),
    });

    if (!res.ok) {
      const data = await res.json();
      if (res.status === 401) {
        savePendingQuiz(moduleId, payload);
        const returnUrl = `/modules/${moduleId}/quiz?resume=1`;
        router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
        return false;
      }
      alert(data.error ?? "Failed to submit quiz");
      return false;
    }

    const data = await res.json();
    clearPendingQuiz(moduleId);
    router.push(`/modules/${moduleId}/results?attemptId=${data.attemptId}`);
    return true;
  }

  useEffect(() => {
    if (resumeHandled.current) return;

    const pending = loadPendingQuiz(moduleId);
    if (!pending) return;

    resumeHandled.current = true;
    setAnswers(pendingToAnswerMap(pending));

    if (searchParams.get("resume") !== "1") return;

    setResuming(true);
    void (async () => {
      try {
        await submitAnswers(pending.answers);
      } finally {
        setResuming(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, searchParams]);

  if (!current) {
    return (
      <p className="text-center text-slate-500">No questions available for this quiz.</p>
    );
  }

  function selectOption(index: number) {
    setAnswers((prev) => ({ ...prev, [current.id]: index }));
  }

  async function handleSubmit() {
    const unanswered = questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      const proceed = window.confirm(
        `You have ${unanswered.length} unanswered question(s). Submit anyway?`,
      );
      if (!proceed) return;
    }

    setSubmitting(true);
    try {
      await submitAnswers(buildAnswerPayload());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <ModuleStepper current="quiz" moduleTitle={title} />

      {resuming && (
        <div className="mb-4 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          Submitting your saved answers…
        </div>
      )}

      <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
        <span>
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span>~{durationMins} min · {answeredCount}/{questions.length} answered</span>
      </div>

      <div className="mb-4 flex gap-1">
        {questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              i === currentIndex ? "bg-brand-600" : answers[q.id] !== undefined ? "bg-brand-300" : "bg-slate-200",
            )}
            aria-label={`Go to question ${i + 1}`}
          />
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-medium text-slate-900">{current.text}</h2>
          <div className="mt-6 space-y-3">
            {current.options.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectOption(index)}
                disabled={resuming}
                className={cn(
                  "w-full rounded-lg border p-4 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                  answers[current.id] === index
                    ? "border-brand-600 bg-brand-50 text-brand-900"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <span className="mr-3 font-medium text-slate-400">
                  {String.fromCharCode(65 + index)}.
                </span>
                {option}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((i) => i - 1)}
          disabled={currentIndex === 0 || resuming}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {isLast ? (
          <Button onClick={handleSubmit} disabled={submitting || resuming}>
            <Send className="h-4 w-4" />
            {submitting || resuming ? "Submitting…" : "Submit quiz"}
          </Button>
        ) : (
          <Button onClick={() => setCurrentIndex((i) => i + 1)} disabled={resuming}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
