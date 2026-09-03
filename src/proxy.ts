import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ROUTES } from "@/lib/constants";

const PUBLIC_PATHS = [
  "/",
  "/jobs",
  "/api/auth",
];

const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((path) => pathname === path);
}

function getDashboardForRole(role: string): string {
  switch (role) {
    case "RECRUITER":
      return ROUTES.RECRUITER.DASHBOARD;
    case "ADMIN":
      return ROUTES.ADMIN.DASHBOARD;
    default:
      return ROUTES.STUDENT.DASHBOARD;
  }
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Always allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Authenticated user visiting auth pages → redirect to dashboard
  if (isAuthPath(pathname) && session) {
    const role = (session.user as { role?: string })?.role ?? "STUDENT";
    return NextResponse.redirect(
      new URL(getDashboardForRole(role), req.nextUrl.origin)
    );
  }

  // Auth pages are accessible without session
  if (isAuthPath(pathname)) {
    return NextResponse.next();
  }

  // No session → redirect to login with return URL
  if (!session) {
    const loginUrl = new URL(ROUTES.LOGIN, req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (session.user as { role?: string })?.role ?? "STUDENT";

  // Student-only routes (recruiters blocked, admins allowed)
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/resume") ||
    pathname.startsWith("/skill-gap") ||
    pathname.startsWith("/dsa") ||
    pathname.startsWith("/interview") ||
    pathname.startsWith("/ai-assistant") ||
    pathname.startsWith("/applications") ||
    pathname.startsWith("/notifications")
  ) {
    if (role !== "STUDENT" && role !== "ADMIN") {
      return NextResponse.redirect(
        new URL(getDashboardForRole(role), req.nextUrl.origin)
      );
    }
  }

  // Admin-only routes
  if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(
        new URL(getDashboardForRole(role), req.nextUrl.origin)
      );
    }
  }

  // Recruiter routes (students blocked, admins allowed)
  if (pathname.startsWith("/recruiter")) {
    if (role !== "RECRUITER" && role !== "ADMIN") {
      return NextResponse.redirect(
        new URL(getDashboardForRole(role), req.nextUrl.origin)
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
