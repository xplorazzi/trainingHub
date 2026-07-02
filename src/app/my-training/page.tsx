import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { getModuleRouteKey } from "@/lib/modules";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { ProgressStatus } from "@/lib/types";

function statusVariant(status: ProgressStatus) {
  switch (status) {
    case "passed":
      return "success" as const;
    case "failed":
      return "destructive" as const;
    case "in_progress":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
}

export default async function MyTrainingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/my-training");

  const progresses = await prisma.moduleProgress.findMany({
    where: { userId: user.id },
    include: {
      module: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id },
    include: { module: true },
    orderBy: { completedAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">My training</h1>
      <p className="mt-2 text-slate-600">Your module progress and quiz history</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Module progress</CardTitle>
          </CardHeader>
          <CardContent>
            {progresses.length === 0 ? (
              <p className="text-slate-500">No progress yet. Start a module from the catalog.</p>
            ) : (
              <ul className="space-y-4">
                {progresses.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-0">
                    <div>
                      <Link
                        href={`/modules/${getModuleRouteKey(p.module)}/video`}
                        className="font-medium text-slate-900 hover:text-brand-600"
                      >
                        {p.module.title}
                      </Link>
                      <p className="text-sm text-slate-500">
                        Attempts: {p.attemptCount}/{p.module.maxAttempts}
                      </p>
                    </div>
                    <Badge variant={statusVariant(p.status as ProgressStatus)}>
                      {p.status.replace("_", " ")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quiz history</CardTitle>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <p className="text-slate-500">No quiz attempts yet.</p>
            ) : (
              <ul className="space-y-3">
                {attempts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{a.module.title}</span>
                      <span className="text-slate-500"> · {formatDate(a.completedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{a.score}/{a.total} ({a.percentage}%)</span>
                      <Badge variant={a.passed ? "success" : "destructive"}>
                        {a.passed ? "Pass" : "Fail"}
                      </Badge>
                      <Link
                        href={`/modules/${getModuleRouteKey(a.module)}/results?attemptId=${a.id}`}
                        className="text-brand-600 hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
