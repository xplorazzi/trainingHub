import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { resolveModuleRecord } from "@/lib/modules";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: moduleKey } = await params;
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const trainingModule = await resolveModuleRecord(moduleKey);
  if (!trainingModule) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  await prisma.moduleProgress.upsert({
    where: {
      userId_moduleId: { userId: user.id, moduleId: trainingModule.id },
    },
    create: {
      userId: user.id,
      moduleId: trainingModule.id,
      videoAcknowledged: true,
      status: "in_progress",
    },
    update: {
      videoAcknowledged: true,
      status: "in_progress",
    },
  });

  return NextResponse.json({ ok: true });
}
