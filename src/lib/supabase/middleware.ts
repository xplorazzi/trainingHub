import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey } from "./env";

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/my-training") ||
    pathname.startsWith("/manager") ||
    pathname.startsWith("/admin")
  );
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public pages: skip Supabase round-trip (major latency win on Netlify)
  if (!isProtectedPath(pathname) && pathname !== "/login") {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseAnonKey()!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const redirectTo = request.nextUrl.searchParams.get("redirect");
    const url = request.nextUrl.clone();
    url.pathname =
      redirectTo && redirectTo.startsWith("/") ? redirectTo : "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
