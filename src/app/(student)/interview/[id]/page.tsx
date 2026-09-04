import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { interviewService } from "@/services/interview/interview-service";
import { InterviewSessionChat } from "@/components/interview/interview-session-chat";

interface InterviewSessionPageProps {
  params: Promise<{ id: string }>;
}

export default async function InterviewSessionPage({
  params,
}: InterviewSessionPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const sessionDetail = await interviewService.getSessionDetail(
    id,
    session.user.id
  );

  if (!sessionDetail) {
    notFound();
  }

  return (
    <div className="py-2">
      <InterviewSessionChat session={sessionDetail} />
    </div>
  );
}
