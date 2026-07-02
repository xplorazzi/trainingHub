import { cache } from "react";
import { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { createClient } from "./supabase/server";
import type { Role as AppRole } from "./types";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}

async function ensureProfile(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const existing = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, role: true },
  });
  if (existing) return existing;

  const email = user.email?.trim();
  if (!email) return null;

  const metadataName = user.user_metadata?.name;
  const name =
    typeof metadataName === "string" && metadataName.trim()
      ? metadataName.trim()
      : email.split("@")[0] || "User";

  try {
    return await prisma.profile.create({
      data: {
        id: user.id,
        email,
        name,
        role: Role.employee,
      },
      select: { id: true, email: true, name: true, role: true },
    });
  } catch {
    return prisma.profile.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, role: true },
    });
  }
}

/** One auth + profile lookup per request (shared by layout and pages). */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    !process.env.DATABASE_URL
  ) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const profile = await ensureProfile(user);
    if (!profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role as AppRole,
    };
  } catch {
    return null;
  }
});

export function canAccessManager(role: AppRole) {
  return role === "manager" || role === "admin";
}

export function canAccessAdmin(role: AppRole) {
  return role === "admin";
}
