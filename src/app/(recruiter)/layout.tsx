import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Briefcase, Users } from "lucide-react";
import { UserMenu } from "@/components/user-menu";

const RECRUITER_NAV = [
  { label: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/recruiter/jobs", icon: Briefcase },
  { label: "Candidates", href: "/recruiter/candidates", icon: Users },
];

export default async function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as {
    name?: string;
    email?: string;
    role?: string;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden md:flex w-64 flex-col shrink-0 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-100">
          <Link href="/" className="text-lg font-bold text-gray-900">
            Job<span className="text-primary-600">Fit</span>
          </Link>
          <p className="text-[10px] font-semibold text-primary-600 uppercase tracking-wider mt-0.5">
            Recruiter
          </p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {RECRUITER_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <UserMenu
            name={user.name ?? "Recruiter"}
            email={user.email ?? ""}
            role={user.role ?? "RECRUITER"}
          />
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
