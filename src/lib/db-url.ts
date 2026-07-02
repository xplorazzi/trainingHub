/**
 * Supabase transaction pooler (6543) + Prisma requires pgbouncer=true.
 * Direct / session pooler (5432) is often unreachable on some networks — use pooled URL everywhere.
 */

function withPoolerParams(url: string): string {
  // Transaction pooler (6543) needs pgbouncer mode; direct 5432 must not use it.
  if (!url.includes(":6543")) {
    return url;
  }

  const params = new URLSearchParams(url.includes("?") ? url.split("?")[1] : "");
  params.set("pgbouncer", "true");
  params.set("connection_limit", "1");

  const base = url.split("?")[0];
  return `${base}?${params.toString()}`;
}

export function getPrismaDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set in .env");
  }
  return withPoolerParams(url);
}

/** Same as runtime — seed uses pooled URL (6543) which works on most networks */
export function getSeedDatabaseUrl(): string {
  return getPrismaDatabaseUrl();
}
