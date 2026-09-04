import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  GraduationCap,
  MessageSquare,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { UserMenu } from "@/components/user-menu";
import { StudentMobileNav } from "@/components/layout/mobile-nav";

const STUDENT_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Resume", href: "/resume", icon: FileText },
  { label: "Jobs", href: "/student/jobs", icon: Briefcase },
  { label: "Applications", href: "/student/applications", icon: ClipboardList },
  { label: "DSA Prep", href: "/dsa", icon: GraduationCap },
  { label: "Interview", href: "/student/mock-interview/setup", icon: MessageSquare },
];

export default async function StudentLayout({
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
    image?: string;
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col shrink-0 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Job<span className="text-primary-600">Fit</span>
            </span>
            <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
              <Sparkles className="mr-0.5 h-2.5 w-2.5" /> Student
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {STUDENT_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <Icon className="h-4 w-4 text-gray-500" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <UserMenu
            name={user.name ?? "User"}
            email={user.email ?? ""}
            role={user.role ?? "STUDENT"}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <StudentMobileNav />
    </div>
  );
}
