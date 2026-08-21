import type {NextRequest} from "next/server"
import {NextResponse} from "next/server"
import {decrypt, SESSION_COOKIE} from "@/lib/auth/token"

/**
 * Optimistic auth gate. This only reads the signed cookie — the authoritative
 * check lives in `verifySession()` (src/lib/auth/dal.ts), which every dashboard
 * data request goes through.
 *
 * Scoped by `matcher` to the dashboard and login routes so the rest of the
 * site never pays for it.
 */
export async function proxy(request: NextRequest) {
  const {pathname} = request.nextUrl
  const session = await decrypt(request.cookies.get(SESSION_COOKIE)?.value)

  if (pathname.startsWith("/dashboard") && !session) {
    const loginUrl = new URL("/login", request.nextUrl)
    // Remember where they were headed so login can bounce them back.
    if (pathname !== "/dashboard") loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
