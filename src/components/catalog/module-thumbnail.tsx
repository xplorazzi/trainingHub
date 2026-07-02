"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import {
  resolveModuleThumbnail,
  youtubeThumbnailFromVideoUrl,
} from "@/lib/thumbnails";

export function ModuleThumbnail({
  thumbnail,
  videoUrl,
  title,
}: {
  thumbnail: string | null;
  videoUrl?: string | null;
  title: string;
}) {
  const fallback = youtubeThumbnailFromVideoUrl(videoUrl);
  const initial = resolveModuleThumbnail(thumbnail, videoUrl);
  const [src, setSrc] = useState(initial);
  const [failed, setFailed] = useState(!initial);

  if (failed || !src) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100 text-slate-400">
        <PlayCircle className="h-12 w-12" aria-hidden />
        <span className="sr-only">{title}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external catalog thumbnails need runtime fallback
    <img
      src={src}
      alt=""
      width={400}
      height={225}
      className="h-full w-full object-cover"
      loading="lazy"
      decoding="async"
      onError={() => {
        if (fallback && src !== fallback) {
          setSrc(fallback);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
