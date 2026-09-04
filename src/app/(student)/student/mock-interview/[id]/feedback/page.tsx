import React from "react";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { interviewService } from "@/services/interview/interview-service";
import { interviewDAL } from "@/dal/interview";
import { PageHeader } from "@/components/layout/page-header";
import { MockInterviewScorecard } from "@/components/interview/mock-interview-scorecard";

export const metadata = {
  title: "Interview Scorecard | JobFit",
  description: "Comprehensive diagnostic scorecard and advisory evaluation for your AI mock interview.",
};

interface FeedbackPageProps {
  params: Promise<{ id: string }>;
}

export default async function MockInterviewFeedbackPage({
  params,
}: FeedbackPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const { id } = await params;

  const [sessionDetail, feedbackRecord] = await Promise.all([
    interviewService.getSessionDetail(id, userId),
    interviewDAL.getInterviewFeedback(id, userId),
  ]);

  if (!sessionDetail) {
    notFound();
  }

  // Construct structured feedback object
  const feedbackData = feedbackRecord || {
    overallScore: sessionDetail.overallScore ?? 75,
    technicalScore: sessionDetail.technicalScore ?? 75,
    communicationScore: sessionDetail.communicationScore ?? 80,
    strengths: (sessionDetail.feedback as any)?.strengths || [
      "Good foundational technical awareness",
      "Direct responses to primary prompts",
    ],
    weaknesses: (sessionDetail.feedback as any)?.weaknesses || [
      "Can provide more concrete implementation trade-offs",
    ],
    suggestions: (sessionDetail.feedback as any)?.suggestions || [
      "Practice articulating edge cases in dynamic follow-ups",
    ],
    detailedFeedback:
      (sessionDetail.feedback as any)?.detailedFeedback ||
      "Completed mock interview session. Review each question below to inspect advisory feedback and strengths.",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Interview Diagnostic Scorecard"
        description="Comprehensive evaluation of technical correctness, communication clarity, and problem-solving depth."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Mock Interview", href: "/student/mock-interview/setup" },
          { label: "Scorecard" },
        ]}
      />

      <MockInterviewScorecard
        session={sessionDetail}
        feedback={{
          overallScore: feedbackData.overallScore,
          technicalScore: feedbackData.technicalScore,
          communicationScore: feedbackData.communicationScore,
          strengths: feedbackData.strengths as string[],
          weaknesses: feedbackData.weaknesses as string[],
          suggestions: feedbackData.suggestions as string[],
          detailedFeedback: feedbackData.detailedFeedback,
        }}
      />
    </div>
  );
}
