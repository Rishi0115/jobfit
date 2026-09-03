import React from "react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4">
      <Link href="/" className="mb-8 text-2xl font-bold tracking-tight">
        Job<span className="text-primary-600">Fit</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
