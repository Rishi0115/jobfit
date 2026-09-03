"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, ChevronDown } from "lucide-react";
import { logoutUser } from "@/actions/auth";

const ROLE_LABELS: Record<string, string> = {
  STUDENT: "Student",
  RECRUITER: "Recruiter",
  ADMIN: "Admin",
};

interface UserMenuProps {
  name: string;
  email: string;
  role: string;
}

export function UserMenu({ name, email, role }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    await logoutUser();
    router.push("/");
    router.refresh();
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-100 transition-colors"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
          {initials}
        </span>
        <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
          {name}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-500 truncate">{email}</p>
            <span className="mt-1 inline-block rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700 uppercase tracking-wide">
              {ROLE_LABELS[role] ?? role}
            </span>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                setOpen(false);
                router.push("/profile");
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User className="h-4 w-4 text-gray-400" />
              Profile
            </button>
          </div>

          <div className="border-t border-gray-100 py-1">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
