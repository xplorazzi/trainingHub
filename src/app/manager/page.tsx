import Link from "next/link";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser, canAccessManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function ManagerPage() {
  const user = await getSessionUser();
  if (!user || !canAccessManager(user.role)) redirect("/");

  const attempts = await prisma.attempt.findMany({
    include: { user: true, module: true },
    orderBy: { completedAt: "desc" },
  });

  const modules = await prisma.trainingModule.findMany();
  const moduleStats = modules.map((m) => {
    const moduleAttempts = attempts.filter((a) => a.moduleId === m.id);
    const passed = moduleAttempts.filter((a) => a.passed).length;
    const avg =
      moduleAttempts.length > 0
        ? Math.round(
            moduleAttempts.reduce((s, a) => s + a.percentage, 0) / moduleAttempts.length,
          )
        : 0;
    return {
      id: m.id,
      title: m.title,
      total: moduleAttempts.length,
      passed,
      completionPct:
        moduleAttempts.length > 0
          ? Math.round((passed / moduleAttempts.length) * 100)
          : 0,
      avgScore: avg,
    };
  });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manager dashboard</h1>
          <p className="mt-2 text-slate-600">Team training completion and scores</p>
        </div>
        <Link href="/api/manager/export">
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {moduleStats.map((stat) => (
          <Card key={stat.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              <p>{stat.passed}/{stat.total} passed ({stat.completionPct}%)</p>
              <p>Avg score: {stat.avgScore}%</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>All attempts</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-3 pr-4">Employee</th>
                <th className="pb-3 pr-4">Module</th>
                <th className="pb-3 pr-4">Score</th>
                <th className="pb-3 pr-4">Result</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">{a.user.name}</td>
                  <td className="py-3 pr-4">{a.module.title}</td>
                  <td className="py-3 pr-4">
                    {a.score}/{a.total} ({a.percentage}%)
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={a.passed ? "success" : "destructive"}>
                      {a.passed ? "Pass" : "Fail"}
                    </Badge>
                  </td>
                  <td className="py-3">{formatDate(a.completedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {attempts.length === 0 && (
            <p className="py-8 text-center text-slate-500">No attempts recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
