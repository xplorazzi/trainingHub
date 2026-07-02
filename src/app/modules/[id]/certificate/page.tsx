import Link from "next/link";
import { notFound } from "next/navigation";
import { Award } from "lucide-react";
import { PrintButton } from "@/components/certificate/print-button";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();

  const trainingModule = await prisma.trainingModule.findUnique({ where: { id } });
  if (!trainingModule) notFound();

  const progress = user
    ? await prisma.moduleProgress.findUnique({
        where: { userId_moduleId: { userId: user.id, moduleId: id } },
      })
    : null;

  if (!progress || progress.status !== "passed") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="text-amber-900">Certificate available only after passing this module.</p>
        <Link href={`/modules/${id}/quiz`} className="mt-4 text-brand-600 hover:underline">
          Take the quiz
        </Link>
      </div>
    );
  }

  const displayName = user?.name ?? "Trainee";
  const date = formatDate(new Date());

  return (
    <div>
      <div
        id="certificate"
        className="mx-auto max-w-2xl rounded-2xl border-4 border-brand-200 bg-white p-10 shadow-lg print:shadow-none"
      >
        <div className="text-center">
          <Award className="mx-auto h-16 w-16 text-brand-600" />
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Certificate of Completion</h1>
          <p className="mt-2 text-slate-500">xperie.nz TrainHub Employee Training</p>
          <div className="my-8 border-y border-slate-200 py-8">
            <p className="text-lg text-slate-600">This certifies that</p>
            <p className="mt-2 text-2xl font-semibold text-brand-700">{displayName}</p>
            <p className="mt-4 text-slate-600">has successfully completed</p>
            <p className="mt-2 text-xl font-medium text-slate-900">{trainingModule.title}</p>
          </div>
          <p className="text-sm text-slate-500">Issued on {date}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-4 no-print">
        <PrintButton />
        <Link
          href="/"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Back to catalog
        </Link>
      </div>
    </div>
  );
}
