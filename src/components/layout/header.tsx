import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth";
import { canAccessAdmin, canAccessManager } from "@/lib/auth";

export function Header({ user }: { user: SessionUser | null }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 font-semibold text-slate-900">
          <Image
            src="/xperie-logo.png"
            alt="xperie.nz"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
            priority
          />
          <span>
            xperie<span className="text-brand-600">.nz</span> TrainHub
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Catalog
          </Link>
          {user && (
            <Link
              href="/my-training"
              className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              My Training
            </Link>
          )}
          {user && canAccessManager(user.role) && (
            <Link
              href="/manager"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Manager</span>
            </Link>
          )}
          {user && canAccessAdmin(user.role) && (
            <Link
              href="/admin/modules"
              className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Admin
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-2 pl-2">
              <span className="hidden items-center gap-1 text-sm text-slate-500 sm:flex">
                <User className="h-4 w-4" />
                {user.name}
              </span>
              <form action="/auth/signout" method="post">
                <Button type="submit" variant="ghost" size="sm">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </form>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
