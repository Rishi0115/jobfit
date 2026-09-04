import React from "react";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { interviewService } from "@/services/interview/interview-service";
import { MockInterviewArena } from "@/components/interview/mock-interview-arena";

export const metadata = {
  title: "Live Mock Interview | JobFit",
  description: "Interactive AI mock interview session with dynamic follow-up probing and immediate feedback.",
};

interface ArenaPageProps {
  params: Promise<{ id: string }>;
}

export default async function MockInterviewArenaPage({ params }: ArenaPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const sessionDetail = await interviewService.getSessionDetail(
    id,
    session.user.id
  );

  if (!sessionDetail) {
    notFound();
  }

  // If already finished, navigate straight to the scorecard
  if (sessionDetail.status === "COMPLETED") {
    redirect(`/student/mock-interview/${id}/feedback`);
  }

  return (
    <div className="py-2">
      <MockInterviewArena initialSession={sessionDetail} />
    </div>
  );
}
