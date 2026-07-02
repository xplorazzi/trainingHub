import { NextResponse } from "next/server";
import { describeDatabaseUrl } from "@/lib/db-url";
import { pingDatabase } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const description = databaseUrl
    ? describeDatabaseUrl(databaseUrl)
    : {
        host: "missing",
        port: "missing",
        user: "missing",
        isPooler: false,
        isDirectDbHost: false,
        hasProjectRefInUser: false,
        looksCorrectForNetlify: false,
      };

  let dbOk = false;
  let dbError: string | null = null;

  if (databaseUrl) {
    try {
      await pingDatabase();
      dbOk = true;
    } catch (error) {
      dbError = error instanceof Error ? error.message : "Unknown database error";
    }
  } else {
    dbError = "DATABASE_URL is not set";
  }

  return NextResponse.json({
    dbOk,
    dbError,
    checks: {
      ...description,
      directUrlConfigured: Boolean(process.env.DIRECT_URL),
    },
    hint: description.looksCorrectForNetlify
      ? "DATABASE_URL format looks correct. If dbOk is false, redeploy after updating env vars or check Supabase project status."
      : "Set DATABASE_URL to Supabase Transaction pooler (6543). Username must be postgres.PROJECT_REF and host must be *.pooler.supabase.com.",
  });
}
