import { auth } from "@/lib/auth";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { UserMenu } from "./user-menu";

function getDashboardHref(role: string): string {
  switch (role) {
    case "RECRUITER":
      return "/recruiter/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return "/dashboard";
  }
}

export async function Navbar() {
  const session = await auth();
  const user = session?.user as
    | { name?: string; email?: string; role?: string; image?: string }
    | undefined;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8 mx-auto max-w-7xl">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-gray-900">
            Job<span className="text-primary-600">Fit</span>
          </span>
          <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
            <Sparkles className="mr-1 h-3 w-3" /> AI
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <Link
              href={getDashboardHref(user.role ?? "STUDENT")}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </Link>
            <UserMenu
              name={user.name ?? "User"}
              email={user.email ?? ""}
              role={user.role ?? "STUDENT"}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 h-9 px-4 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 h-9 px-4 py-2 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
