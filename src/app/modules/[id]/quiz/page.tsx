import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { QuizClient } from "@/components/quiz/quiz-client";
import { getSessionUser } from "@/lib/auth";
import { getModuleForQuiz, getModuleRouteKey } from "@/lib/modules";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const user = await getSessionUser();
    const trainingModule = await getModuleForQuiz(id, user?.id);
    if (!trainingModule) notFound();

    const moduleKey = getModuleRouteKey(trainingModule);

    if (user && trainingModule.progress?.status === "passed") {
      redirect(`/modules/${moduleKey}/video`);
    }

    if (
      user &&
      trainingModule.progress &&
      trainingModule.progress.attemptCount >= trainingModule.maxAttempts &&
      trainingModule.progress.status === "failed"
    ) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="text-xl font-semibold text-red-900">Maximum attempts reached</h2>
          <p className="mt-2 text-red-700">
            You have used all {trainingModule.maxAttempts} attempts for this module.
          </p>
          <Link href="/" className="mt-4 inline-block text-brand-600 hover:underline">
            Back to catalog
          </Link>
        </div>
      );
    }

    const questions = trainingModule.questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options,
    }));

    if (questions.length === 0) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-amber-900">No quiz questions yet</h2>
          <p className="mt-2 text-amber-800">
            This module does not have any questions configured.
          </p>
          <Link
            href={`/modules/${moduleKey}/video`}
            className="mt-4 inline-block text-brand-600 hover:underline"
          >
            Back to video
          </Link>
        </div>
      );
    }

    return (
      <div>
        <Link
          href={`/modules/${moduleKey}/video`}
          className="mb-4 text-sm text-brand-600 hover:text-brand-700"
        >
          ← Back to video
        </Link>
        <Suspense
          fallback={
            <div className="py-12 text-center text-slate-500">Loading quiz…</div>
          }
        >
          <QuizClient
            moduleId={moduleKey}
            title={trainingModule.title}
            questions={questions}
            durationMins={trainingModule.durationMins}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_")
    ) {
      throw error;
    }

    console.error("QuizPage error:", error);
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <h2 className="text-lg font-semibold text-red-900">Could not load quiz</h2>
        <p className="mt-2 text-red-700">
          Something went wrong loading this module. Try refreshing, or return to the catalog.
        </p>
        <Link href="/" className="mt-4 inline-block text-brand-600 hover:underline">
          Back to catalog
        </Link>
      </div>
    );
  }
}
