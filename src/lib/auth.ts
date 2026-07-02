import { cache } from "react";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { createClient } from "./supabase/server";
import { getSupabaseAnonKey } from "./supabase/env";
import type { Role as AppRole } from "./types";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}

export type RequestAuthResult =
  | { ok: true; user: SessionUser }
  | {
      ok: false;
      status: 401 | 503 | 500;
      code: "AUTH_REQUIRED" | "DB_ERROR" | "MISCONFIGURED";
      error: string;
    };

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

type ProfileRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

function profileName(user: SupabaseAuthUser, email: string) {
  const metadataName = user.user_metadata?.name;
  return typeof metadataName === "string" && metadataName.trim()
    ? metadataName.trim()
    : email.split("@")[0] || "User";
}

async function ensureProfileViaSupabase(
  user: SupabaseAuthUser,
): Promise<ProfileRow | null> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const email = user.email?.trim();

  if (!serviceKey || !supabaseUrl || !email) return null;

  const admin = createSupabaseJsClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing } = await admin
    .from("profiles")
    .select("id, email, name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      email: existing.email,
      name: existing.name,
      role: existing.role as Role,
    };
  }

  const { data: created, error } = await admin
    .from("profiles")
    .upsert({
      id: user.id,
      email,
      name: profileName(user, email),
      role: Role.employee,
    })
    .select("id, email, name, role")
    .single();

  if (error || !created) {
    console.error("Supabase profile upsert failed:", error?.message);
    return null;
  }

  return {
    id: created.id,
    email: created.email,
    name: created.name,
    role: created.role as Role,
  };
}

async function ensureProfileViaPrisma(
  user: SupabaseAuthUser,
): Promise<ProfileRow | null> {
  const existing = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, role: true },
  });
  if (existing) return existing;

  const email = user.email?.trim();
  if (!email) return null;

  return prisma.profile.create({
    data: {
      id: user.id,
      email,
      name: profileName(user, email),
      role: Role.employee,
    },
    select: { id: true, email: true, name: true, role: true },
  });
}

async function ensureProfile(user: SupabaseAuthUser): Promise<ProfileRow | null> {
  try {
    return await ensureProfileViaPrisma(user);
  } catch (error) {
    console.error("Prisma profile lookup failed, trying Supabase API:", error);
    return ensureProfileViaSupabase(user);
  }
}

function toSessionUser(profile: {
  id: string;
  email: string;
  name: string;
  role: Role;
}): SessionUser {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role as AppRole,
  };
}

async function getSupabaseUserFromBearerToken(token: string) {
  const supabase = createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseAnonKey()!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return user;
}

async function getSupabaseUserFromCookies() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Resolve the signed-in user for API route handlers (Bearer token + cookies). */
export async function authenticateRequest(
  request: Request,
): Promise<RequestAuthResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !getSupabaseAnonKey()) {
    return {
      ok: false,
      status: 500,
      code: "MISCONFIGURED",
      error: "Supabase is not configured on the server.",
    };
  }

  if (!process.env.DATABASE_URL) {
    return {
      ok: false,
      status: 500,
      code: "MISCONFIGURED",
      error: "DATABASE_URL is not set on the server.",
    };
  }

  let supabaseUser: SupabaseAuthUser | null = null;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      supabaseUser = await getSupabaseUserFromBearerToken(token);
    }
  }

  if (!supabaseUser) {
    try {
      supabaseUser = await getSupabaseUserFromCookies();
    } catch (error) {
      console.error("Cookie auth failed:", error);
    }
  }

  if (!supabaseUser) {
    return {
      ok: false,
      status: 401,
      code: "AUTH_REQUIRED",
      error: "Sign in required to submit quiz.",
    };
  }

  try {
    const profile = await ensureProfile(supabaseUser);
    if (!profile) {
      return {
        ok: false,
        status: 503,
        code: "DB_ERROR",
        error: "Could not create your user profile. Check the database connection.",
      };
    }

    return { ok: true, user: toSessionUser(profile) };
  } catch (error) {
    console.error("Profile lookup failed:", error);
    return {
      ok: false,
      status: 503,
      code: "DB_ERROR",
      error:
        "Database connection failed. In Netlify env vars, set DATABASE_URL to the Supabase transaction pooler (port 6543, user postgres.PROJECT_REF). Then redeploy. Open /api/health/db to verify.",
    };
  }
}

/** @deprecated Use authenticateRequest in API routes for clearer errors. */
export async function getSessionUserFromRequest(
  request: Request,
): Promise<SessionUser | null> {
  const result = await authenticateRequest(request);
  return result.ok ? result.user : null;
}

/** One auth + profile lookup per request (shared by layout and pages). */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !getSupabaseAnonKey() ||
    !process.env.DATABASE_URL
  ) {
    return null;
  }

  try {
    const supabaseUser = await getSupabaseUserFromCookies();
    if (!supabaseUser) return null;

    const profile = await ensureProfile(supabaseUser);
    if (!profile) return null;

    return toSessionUser(profile);
  } catch (error) {
    console.error("getSessionUser error:", error);
    return null;
  }
});

export function canAccessManager(role: AppRole) {
  return role === "manager" || role === "admin";
}

export function canAccessAdmin(role: AppRole) {
  return role === "admin";
}
