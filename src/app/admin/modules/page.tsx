import { redirect } from "next/navigation";
import { AdminModulesClient } from "@/components/admin/admin-modules-client";
import { getSessionUser, canAccessAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminModulesPage() {
  const user = await getSessionUser();
  if (!user || !canAccessAdmin(user.role)) redirect("/");

  const modules = await prisma.trainingModule.findMany({
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  const serialized = modules.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    videoUrl: m.videoUrl,
    thumbnail: m.thumbnail ?? "",
    passThreshold: m.passThreshold,
    durationMins: m.durationMins,
    category: m.category,
    maxAttempts: m.maxAttempts,
    questions: m.questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    })),
  }));

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Admin — Modules</h1>
      <p className="mt-2 text-slate-600">
        Edit module details, catalog thumbnail image URL, video link, and MCQ questions.
      </p>
      <AdminModulesClient modules={serialized} />
    </div>
  );
}
