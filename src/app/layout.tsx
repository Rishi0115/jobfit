import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "JobFit — AI-Powered Career & Job Matching Platform",
  description:
    "Upload your resume once and let JobFit become your personalized career assistant with smart job matching, skill gap analysis, and AI mock interviews.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} font-sans min-h-full antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
