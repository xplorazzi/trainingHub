"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { authJsonHeaders } from "@/lib/supabase/fetch-auth";
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
  const initialized = useRef(false);
  const submitCompleted = useRef(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [resumeMessage, setResumeMessage] = useState<string | null>(null);

  const current = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isLast = currentIndex === questions.length - 1;

  const buildAnswerPayload = useCallback((): PendingQuizAnswer[] => {
    return questions.map((q) => ({
      questionId: q.id,
      selectedIndex: answers[q.id] ?? -1,
    }));
  }, [answers, questions]);

  const submitAnswers = useCallback(
    async (payload: PendingQuizAnswer[]) => {
      const headers = await authJsonHeaders();
      const res = await fetch(`/api/modules/${moduleId}/submit`, {
        method: "POST",
        headers,
        credentials: "same-origin",
        body: JSON.stringify({ answers: payload }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        savePendingQuiz(moduleId, payload);

        if (data.code === "DB_ERROR" || res.status === 503) {
          setResumeMessage(
            data.error ??
              "Database connection failed on the server. Check Netlify DATABASE_URL (port 6543 pooler).",
          );
          return false;
        }

        if (res.status === 401) {
          if (headers.Authorization) {
            setResumeMessage("Your sign-in session expired. Redirecting to sign in…");
          } else {
            setResumeMessage("Sign in is required to submit. Redirecting to sign in…");
          }
          const returnUrl = `/modules/${moduleId}/quiz`;
          window.setTimeout(() => {
            window.location.href = `/login?redirect=${encodeURIComponent(returnUrl)}`;
          }, 1200);
          return false;
        }

        setResumeMessage(
          typeof data.error === "string"
            ? data.error
            : "Failed to submit quiz. Please try again.",
        );
        return false;
      }

      const data = await res.json();
      submitCompleted.current = true;
      clearPendingQuiz(moduleId);
      window.location.href = `/modules/${moduleId}/results?attemptId=${data.attemptId}`;
      return true;
    },
    [moduleId],
  );

  useEffect(() => {
    if (submitCompleted.current || answeredCount === 0) return;
    savePendingQuiz(moduleId, buildAnswerPayload());
  }, [answeredCount, buildAnswerPayload, moduleId]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (searchParams.get("resume") === "1") {
      router.replace(`/modules/${moduleId}/quiz`);
    }

    const pending = loadPendingQuiz(moduleId);
    if (!pending) return;

    setAnswers(pendingToAnswerMap(pending));
    setCurrentIndex(questions.length - 1);
    setResumeMessage(
      "Your saved answers were restored. Review and click Submit quiz to finish.",
    );
  }, [moduleId, questions.length, router, searchParams]);

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
    setResumeMessage(null);
    try {
      await submitAnswers(buildAnswerPayload());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <ModuleStepper current="quiz" moduleTitle={title} />

      {resumeMessage && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {resumeMessage}
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
                disabled={submitting}
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
          disabled={currentIndex === 0 || submitting}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {isLast ? (
          <Button onClick={handleSubmit} disabled={submitting}>
            <Send className="h-4 w-4" />
            {submitting ? "Submitting…" : "Submit quiz"}
          </Button>
        ) : (
          <Button onClick={() => setCurrentIndex((i) => i + 1)} disabled={submitting}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
