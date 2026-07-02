import { NextResponse } from "next/server";
import { getSessionUser, canAccessManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !canAccessManager(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const attempts = await prisma.attempt.findMany({
    include: {
      user: true,
      module: true,
    },
    orderBy: { completedAt: "desc" },
  });

  const header = "Employee,Email,Module,Score,Total,Percentage,Pass/Fail,Date";
  const rows = attempts.map((a) =>
    [
      a.user.name,
      a.user.email,
      a.module.title,
      a.score,
      a.total,
      a.percentage,
      a.passed ? "Pass" : "Fail",
      formatDate(a.completedAt),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=training-report.csv",
    },
  });
}
