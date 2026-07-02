import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoClient } from "@/components/video/video-client";
import { getSessionUser } from "@/lib/auth";
import { getModuleForVideo, getModuleRouteKey } from "@/lib/modules";

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  const trainingModule = await getModuleForVideo(id, user?.id);

  if (!trainingModule) notFound();

  const moduleKey = getModuleRouteKey(trainingModule);

  return (
    <div>
      <Link
        href="/"
        className="mb-4 text-sm text-brand-600 hover:text-brand-700"
      >
        ← Back to catalog
      </Link>
      <VideoClient
        moduleId={moduleKey}
        title={trainingModule.title}
        videoUrl={trainingModule.videoUrl}
        objectives={trainingModule.objectives}
        acknowledged={trainingModule.progress?.videoAcknowledged ?? false}
      />
    </div>
  );
}
