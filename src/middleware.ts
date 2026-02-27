import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Get token from request
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

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
