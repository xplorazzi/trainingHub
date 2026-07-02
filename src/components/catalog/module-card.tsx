import Link from "next/link";
import { Clock } from "lucide-react";
import { ModuleThumbnail } from "@/components/catalog/module-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgressStatus } from "@/lib/types";

function statusBadge(status: ProgressStatus | null) {
  switch (status) {
    case "passed":
      return <Badge variant="success">Passed</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    case "in_progress":
      return <Badge variant="warning">In progress</Badge>;
    default:
      return <Badge variant="secondary">Not started</Badge>;
  }
}

export function ModuleCard({
  id,
  slug,
  title,
  description,
  category,
  durationMins,
  thumbnail,
  videoUrl,
  required,
  progress,
}: {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  category: string;
  durationMins: number;
  thumbnail: string | null;
  videoUrl?: string | null;
  required: boolean;
  progress: { status: ProgressStatus; attemptCount: number } | null;
}) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="aspect-video bg-slate-100">
        <ModuleThumbnail thumbnail={thumbnail} videoUrl={videoUrl} title={title} />
      </div>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{category}</Badge>
          {required && <Badge variant="default">Required</Badge>}
          {statusBadge(progress?.status ?? null)}
        </div>
        <CardTitle className="line-clamp-2">{title}</CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-sm text-slate-500">
          <Clock className="h-4 w-4" />
          {durationMins} min
        </span>
        <Link
          href={`/modules/${slug ?? id}/video`}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          {progress?.status === "passed" ? "Review" : "Start training"} →
        </Link>
      </CardContent>
    </Card>
  );
}
