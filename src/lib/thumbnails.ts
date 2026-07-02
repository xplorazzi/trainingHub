/** Extract a YouTube video id from common embed / watch URLs. */
export function getYoutubeVideoId(videoUrl: string | null | undefined): string | null {
  if (!videoUrl) return null;

  const patterns = [
    /youtube\.com\/embed\/([^?&/]+)/i,
    /youtube\.com\/watch\?v=([^?&/]+)/i,
    /youtu\.be\/([^?&/]+)/i,
    /youtube\.com\/shorts\/([^?&/]+)/i,
  ];

  for (const pattern of patterns) {
    const match = videoUrl.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

export function youtubeThumbnailFromVideoUrl(
  videoUrl: string | null | undefined,
  quality: "hqdefault" | "mqdefault" | "sddefault" = "hqdefault",
): string | null {
  const videoId = getYoutubeVideoId(videoUrl);
  if (!videoId) return null;
  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
}

/** Prefer stored thumbnail; fall back to the module video's YouTube preview image. */
export function resolveModuleThumbnail(
  thumbnail: string | null | undefined,
  videoUrl: string | null | undefined,
): string | null {
  const trimmed = thumbnail?.trim();
  if (trimmed) return trimmed;

  return youtubeThumbnailFromVideoUrl(videoUrl);
}
