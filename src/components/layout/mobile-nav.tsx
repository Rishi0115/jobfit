"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Resume", href: "/resume", icon: FileText },
  { label: "Interview", href: "/interview", icon: MessageSquare },
  { label: "More", href: "/profile", icon: MoreHorizontal },
];

export function StudentMobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md md:hidden">
      <nav className="flex h-16 items-center justify-around px-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors py-1 px-3 rounded-lg",
                isActive
                  ? "text-primary-600 font-semibold"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
