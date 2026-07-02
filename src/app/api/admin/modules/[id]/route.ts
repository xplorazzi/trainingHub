import { NextResponse } from "next/server";
import { getSessionUser, canAccessAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface QuestionPayload {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || !canAccessAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  await prisma.trainingModule.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      videoUrl: body.videoUrl,
      thumbnail: body.thumbnail || null,
      passThreshold: Number(body.passThreshold),
      durationMins: Number(body.durationMins),
      category: body.category,
      maxAttempts: Number(body.maxAttempts),
    },
  });

  const questions = (body.questions ?? []) as QuestionPayload[];
  for (const q of questions) {
    if (!q.id) continue;
    await prisma.question.update({
      where: { id: q.id },
      data: {
        text: q.text,
        options: q.options,
        correctIndex: Number(q.correctIndex),
        explanation: q.explanation,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
