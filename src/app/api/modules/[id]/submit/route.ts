import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { resolveModuleRecord } from "@/lib/modules";
import { prisma } from "@/lib/prisma";
import { gradeQuiz, computePassed } from "@/lib/scoring";
import type { QuizAnswer } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: moduleKey } = await params;
    const auth = await authenticateRequest(request);

    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error, code: auth.code },
        { status: auth.status },
      );
    }

    const user = auth.user;

    const trainingModule = await resolveModuleRecord(moduleKey);
  if (!trainingModule) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  const moduleRecord = await prisma.trainingModule.findUnique({
    where: { id: trainingModule.id },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  if (!moduleRecord) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  const progress = await prisma.moduleProgress.findUnique({
    where: {
      userId_moduleId: { userId: user.id, moduleId: trainingModule.id },
    },
  });

  const attemptCount = progress?.attemptCount ?? 0;
  if (attemptCount >= moduleRecord.maxAttempts) {
    return NextResponse.json(
      { error: "Maximum attempts reached for this module" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const answers: QuizAnswer[] = (body.answers ?? []).map(
    (a: { questionId: string; selectedIndex: number }) => ({
      questionId: a.questionId,
      selectedIndex: a.selectedIndex >= 0 ? a.selectedIndex : null,
    }),
  );

  const questionsForGrading = moduleRecord.questions.map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  }));

  const graded = gradeQuiz(questionsForGrading, answers);
  const passed = computePassed(graded.percentage, moduleRecord.passThreshold);

  const attempt = await prisma.attempt.create({
    data: {
      userId: user.id,
      moduleId: trainingModule.id,
      answers: answers as unknown as Prisma.InputJsonValue,
      score: graded.score,
      total: graded.total,
      percentage: graded.percentage,
      passed,
    },
  });

  const newAttemptCount = attemptCount + 1;
  const status = passed ? "passed" : newAttemptCount >= moduleRecord.maxAttempts ? "failed" : "in_progress";

  await prisma.moduleProgress.upsert({
    where: {
      userId_moduleId: { userId: user.id, moduleId: trainingModule.id },
    },
    create: {
      userId: user.id,
      moduleId: trainingModule.id,
      videoAcknowledged: true,
      status,
      attemptCount: newAttemptCount,
      latestAttemptId: attempt.id,
    },
    update: {
      status,
      attemptCount: newAttemptCount,
      latestAttemptId: attempt.id,
    },
  });

  const remainingAttempts = Math.max(0, moduleRecord.maxAttempts - newAttemptCount);
  const canRetake = !passed && remainingAttempts > 0;

  return NextResponse.json({
    attemptId: attempt.id,
    score: graded.score,
    total: graded.total,
    percentage: graded.percentage,
    passed,
    passThreshold: moduleRecord.passThreshold,
    gradedQuestions: graded.gradedQuestions,
    canRetake,
    remainingAttempts,
  });
  } catch (error) {
    console.error("Quiz submit error:", error);
    return NextResponse.json(
      { error: "Could not save your quiz. The database may be unreachable." },
      { status: 503 },
    );
  }
}
