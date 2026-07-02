import { cache } from "react";
import { prisma } from "./prisma";
import { createClient } from "./supabase/server";
import type { Role } from "./types";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
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

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role as Role,
    };
  } catch {
    return null;
  }
});

export function canAccessManager(role: Role) {
  return role === "manager" || role === "admin";
}

export function canAccessAdmin(role: Role) {
  return role === "admin";
}
