
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getServerCookieOptions } from "./shared-auth";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Create Supabase server client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getServerCookieOptions(request.nextUrl.hostname),
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Ensure auth session persists in cookies
  await supabase.auth.getSession();

  return response;
}

// Apply middleware to paths that need auth
export const config = {
  matcher: ["/officiant-portal/:path*", "/tasks/:path*"],
};
