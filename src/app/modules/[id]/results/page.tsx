import Link from "next/link";
import { notFound } from "next/navigation";
import { ResultsClient } from "@/components/results/results-client";
import { getAttemptById, getModuleRouteKey, resolveModuleRecord } from "@/lib/modules";
import { prisma } from "@/lib/prisma";
import { gradeQuiz } from "@/lib/scoring";
import type { QuizAnswer } from "@/lib/types";

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attemptId?: string }>;
}) {
  const { id } = await params;
  const { attemptId } = await searchParams;

  if (!attemptId) {
    return (
      <div className="text-center">
        <p className="text-slate-600">No attempt specified.</p>
        <Link href={`/modules/${id}/quiz`} className="mt-4 text-brand-600 hover:underline">
          Take the quiz
        </Link>
      </div>
    );
  }

  const routeModule = await resolveModuleRecord(id);
  const attempt = await getAttemptById(attemptId);

  if (!attempt || !routeModule || attempt.moduleId !== routeModule.id) {
    notFound();
  }

  const moduleKey = getModuleRouteKey(attempt.module);
  const storedAnswers = attempt.answers as unknown as QuizAnswer[];
  const questionsForGrading = attempt.module.questions.map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  }));

  const graded = gradeQuiz(questionsForGrading, storedAnswers);

  const progress = await prisma.moduleProgress.findUnique({
    where: { userId_moduleId: { userId: attempt.userId, moduleId: attempt.moduleId } },
  });

  const attemptCount = progress?.attemptCount ?? 1;
  const remaining = Math.max(0, attempt.module.maxAttempts - attemptCount);
  const canRetake = !attempt.passed && remaining > 0;

  return (
    <div>
      <Link href="/" className="mb-4 text-sm text-brand-600 hover:text-brand-700">
        ← Back to catalog
      </Link>
      <ResultsClient
        moduleId={moduleKey}
        title={attempt.module.title}
        score={attempt.score}
        total={attempt.total}
        percentage={attempt.percentage}
        passed={attempt.passed}
        passThreshold={attempt.module.passThreshold}
        gradedQuestions={graded.gradedQuestions}
        canRetake={canRetake}
        remainingAttempts={remaining}
      />
    </div>
  );
}
