"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Award, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { ModuleStepper } from "@/components/layout/module-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { clearPendingQuiz } from "@/lib/quiz-pending";
import { cn } from "@/lib/utils";
import type { GradedQuestion } from "@/lib/types";

export function ResultsClient({
  moduleId,
  title,
  score,
  total,
  percentage,
  passed,
  passThreshold,
  gradedQuestions,
  canRetake,
  remainingAttempts,
}: {
  moduleId: string;
  title: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  passThreshold: number;
  gradedQuestions: GradedQuestion[];
  canRetake: boolean;
  remainingAttempts: number;
}) {
  useEffect(() => {
    if (passed) {
      document.body.classList.add("celebrate-pass");
      const t = setTimeout(() => document.body.classList.remove("celebrate-pass"), 3000);
      return () => clearTimeout(t);
    }
  }, [passed]);

  return (
    <div>
      <ModuleStepper current="results" moduleTitle={title} />

      <Card className={cn("mb-6", passed ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50")}>
        <CardContent className="flex flex-col items-center p-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              {passed ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
              <h2 className="text-2xl font-bold text-slate-900">
                {passed ? "Congratulations — you passed!" : "Not passed yet"}
              </h2>
            </div>
            <p className="mt-2 text-slate-600">
              You scored <strong>{score}/{total}</strong> ({percentage}%). Pass threshold is {passThreshold}%.
            </p>
            {!passed && canRetake && (
              <p className="mt-1 text-sm text-slate-500">
                {remainingAttempts} attempt(s) remaining.
              </p>
            )}
          </div>
          {passed && (
            <Link href={`/modules/${moduleId}/certificate`}>
              <Button variant="success" className="mt-4 sm:mt-0">
                <Award className="h-4 w-4" />
                View certificate
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <h3 className="mb-4 text-lg font-semibold text-slate-900">Question review</h3>
      <div className="space-y-4">
        {gradedQuestions.map((q, index) => (
          <Card
            key={q.questionId}
            className={cn(
              q.isCorrect ? "border-emerald-200" : "border-red-200",
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                {q.isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    {index + 1}. {q.text}
                  </p>
                  <div className="mt-3 space-y-1 text-sm">
                    {q.selectedIndex !== null && q.selectedIndex >= 0 ? (
                      <p className={cn(q.isCorrect ? "text-emerald-700" : "text-red-700")}>
                        Your answer: {q.options[q.selectedIndex]}
                      </p>
                    ) : (
                      <p className="text-red-700">Your answer: Not answered</p>
                    )}
                    {!q.isCorrect && (
                      <p className="text-emerald-700">
                        Correct answer: {q.options[q.correctIndex]}
                      </p>
                    )}
                  </div>
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    {q.explanation}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/">
          <Button variant="outline">Back to catalog</Button>
        </Link>
        {!passed && canRetake && (
          <Link
            href={`/modules/${moduleId}/quiz`}
            onClick={() => clearPendingQuiz(moduleId)}
          >
            <Button>
              <RotateCcw className="h-4 w-4" />
              Retake quiz
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
