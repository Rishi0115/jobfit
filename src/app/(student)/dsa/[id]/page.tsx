import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { dsaService } from "@/services/dsa/dsa-service";
import { DSAProblemViewer } from "@/components/dsa/dsa-problem-viewer";

interface DSAProblemPageProps {
  params: Promise<{ id: string }>;
}

export default async function DSAProblemPage({
  params,
}: DSAProblemPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const question = await dsaService.getQuestionDetail(session.user.id, id);

  if (!question) {
    notFound();
  }

  return (
    <div className="py-2">
      <DSAProblemViewer question={question} />
    </div>
  );
}
