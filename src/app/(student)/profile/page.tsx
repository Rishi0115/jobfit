import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { usersDAL } from "@/dal/users";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { Badge } from "@/components/ui/badge";
import { UserCheck } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await usersDAL.findById(session.user.id);
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="My Profile"
        description="Manage your career preferences, contact information, and public profile links."
        actions={
          <Badge variant="success" className="px-3 py-1 text-xs">
            <UserCheck className="mr-1 h-3.5 w-3.5" /> Verified Account
          </Badge>
        }
      />

      <ProfileEditor
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
        }}
        profile={user.profile}
      />
    </div>
  );
}
