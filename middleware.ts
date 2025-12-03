import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export default function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req

  const sessionToken =
    cookies.get("__Secure-authjs.session-token")?.value ||
    cookies.get("authjs.session-token")?.value ||
    cookies.get("next-auth.session-token")?.value

  const isLoggedIn = Boolean(sessionToken)
  const isAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/api/auth") ||
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname.startsWith("/favicon") ||
    nextUrl.pathname.startsWith("/assets")

  if (!isLoggedIn && !isAuthRoute) {
    const url = new URL("/login", nextUrl)
    url.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/auth|_next|.*\\..*).*)"],
}


