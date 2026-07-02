/** Parse an internal redirect target (path + optional query) safely. */
export function resolveInternalRedirect(
  redirectTo: string | null | undefined,
  baseUrl: string,
): URL {
  if (!redirectTo || !redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return new URL("/", baseUrl);
  }

  return new URL(redirectTo, baseUrl);
}
