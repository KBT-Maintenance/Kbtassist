import { DashboardShell } from "@/components/layout/dashboard-shell"
import { EditTeamMemberForm } from "@/components/team/edit-team-member-form"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getTeamMemberDetails } from "@/lib/actions"

export default async function EditTeamMemberPage({ params }: { params: { memberId: string } }) {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { success, member, error } = await getTeamMemberDetails(params.memberId)

  if (!success || !member) {
    console.error("Failed to fetch team member details:", error)
    return (
      <DashboardShell>
        <h2 className="text-2xl font-bold mb-4">Team Member Not Found</h2>
        <p className="text-red-500">Error loading team member details: {error || "Member not found."}</p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <h2 className="text-2xl font-bold mb-4">Edit Team Member: {member.name}</h2>
      <EditTeamMemberForm initialData={member} />
    </DashboardShell>
  )
}
