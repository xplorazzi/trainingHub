import Link from "next/link";
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
  const user = await getSessionUser();

  if (!user) {
    redirect(`/login?redirect=/modules/${id}/quiz`);
  }

  const trainingModule = await getModuleForQuiz(id, user.id);
  if (!trainingModule) notFound();

  if (trainingModule.progress?.status === "passed") {
    redirect(`/modules/${id}/video`);
  }

  if (
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

  const moduleKey = getModuleRouteKey(trainingModule);

  return (
    <div>
      <Link
        href={`/modules/${moduleKey}/video`}
        className="mb-4 text-sm text-brand-600 hover:text-brand-700"
      >
        ← Back to video
      </Link>
      <QuizClient
        moduleId={moduleKey}
        title={trainingModule.title}
        questions={questions}
        durationMins={trainingModule.durationMins}
      />
    </div>
  );
}
