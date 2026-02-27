import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Get token from request (secret required by Auth.js for JWT)
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "development") {
    console.warn("NEXTAUTH_SECRET is not set. Add it to .env for auth to work.");
  }
  const token = secret
    ? await getToken({ req: request, secret })
    : null;

  // Redirect to login if not authenticated (except for public routes)
  if (!isPublicRoute && !token) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  // Redirect to home if logged-in user tries to access login
  if (pathname === "/login" && token) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/";
    return Response.redirect(new URL(callbackUrl, request.url));
  }

  return null;
}

export const config = {
  matcher: [
    // Match all routes except static files, api, and _next
    "/((?!api|_next/static|_next/image|favicon.ico|logo.jpeg).*)",
  ],
};
