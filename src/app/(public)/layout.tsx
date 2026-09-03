import React from "react";
import { Navbar } from "@/components/navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} JobFit — AI-Powered Career Platform</p>
      </footer>
    </div>
  );
}
