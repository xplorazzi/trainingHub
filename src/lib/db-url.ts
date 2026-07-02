/**
 * Supabase transaction pooler (6543) + Prisma requires pgbouncer=true.
 * Direct / session pooler (5432) is often unreachable on serverless — use pooled URL on Netlify.
 */

function getProjectRef(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

function normalizeSupabaseDatabaseUrl(url: string): string {
  let normalized = url.trim();

  // Netlify UI sometimes saves values wrapped in quotes.
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1);
  }

  const projectRef = getProjectRef();
  const hostMatch = normalized.match(/@([^/:?]+)/);
  const host = hostMatch?.[1] ?? "";
  const userMatch = normalized.match(/:\/\/([^:@/]+)/);
  const user = userMatch?.[1] ?? "";

  // Common mistake: pooler host but username is only "postgres".
  if (
    projectRef &&
    host.includes("pooler.supabase.com") &&
    user === "postgres"
  ) {
    normalized = normalized.replace(
      "://postgres:",
      `://postgres.${projectRef}:`,
    );
  }

  return normalized;
}

function withPoolerParams(url: string): string {
  const normalized = normalizeSupabaseDatabaseUrl(url);

  // Transaction pooler (6543) needs pgbouncer mode; direct 5432 must not use it.
  if (!normalized.includes(":6543")) {
    return normalized;
  }

  const params = new URLSearchParams(
    normalized.includes("?") ? normalized.split("?")[1] : "",
  );
  params.set("pgbouncer", "true");
  params.set("connection_limit", "1");
  params.set("sslmode", "require");
  params.set("connect_timeout", "15");

  const base = normalized.split("?")[0];
  return `${base}?${params.toString()}`;
}

export function getPrismaDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set in .env");
  }
  return withPoolerParams(url);
}

export function getDirectDatabaseUrl(): string {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DIRECT_URL or DATABASE_URL must be set");
  }
  return normalizeSupabaseDatabaseUrl(url);
}

export function describeDatabaseUrl(url: string) {
  const normalized = normalizeSupabaseDatabaseUrl(url);
  const host = normalized.match(/@([^/:?]+)/)?.[1] ?? "unknown";
  const port = normalized.match(/:(\d+)(?:\/|\?)/)?.[1] ?? "unknown";
  const user = normalized.match(/:\/\/([^:@/]+)/)?.[1] ?? "unknown";
  const projectRef = getProjectRef();

  return {
    host,
    port,
    user,
    isPooler: host.includes("pooler.supabase.com"),
    isDirectDbHost: host.startsWith("db.") && host.endsWith(".supabase.co"),
    hasProjectRefInUser: projectRef ? user.includes(projectRef) : false,
    looksCorrectForNetlify:
      host.includes("pooler.supabase.com") &&
      port === "6543" &&
      (projectRef ? user === `postgres.${projectRef}` : user.startsWith("postgres.")),
  };
}

/** Same as runtime — seed uses pooled URL (6543) which works on most networks */
export function getSeedDatabaseUrl(): string {
  return getPrismaDatabaseUrl();
}
