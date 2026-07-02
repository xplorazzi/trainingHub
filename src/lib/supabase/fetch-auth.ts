"use client";

import { createClient } from "./client";

/** Headers for authenticated API calls (Netlify serverless may not receive auth cookies). */
export async function authJsonHeaders(
  extra: Record<string, string> = {},
): Promise<Record<string, string>> {
  const supabase = createClient();

  const {
    data: { session: refreshed },
    error: refreshError,
  } = await supabase.auth.refreshSession();

  const session =
    refreshed ??
    (
      await supabase.auth.getSession()
    ).data.session;

  if (refreshError && !session) {
    console.warn("Could not refresh auth session:", refreshError.message);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return headers;
}
