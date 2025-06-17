import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getTeamMembers } from "@/lib/actions"
import { TeamMemberList } from "@/components/team/team-member-list"
import { UserRole } from "@prisma/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { UserPlusIcon } from "lucide-react"

export default async function TeamPage() {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const userRole = (user.user_metadata?.role || "GUEST") as UserRole

  if (userRole !== UserRole.AGENT && userRole !== UserRole.PROPERTY_MANAGER) {
    return (
      <DashboardShell>
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to view this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Only Agents and Property Managers can manage team members.</p>
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  const { success, members, error } = await getTeamMembers(user.id, userRole)

  if (!success) {
    console.error("Failed to fetch team members:", error)
    return (
      <DashboardShell>
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Failed to load team members.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">Error: {error}. Please try again later.</p>
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Your Team</h2>
        <Button asChild>
          <Link href="/people/team/add">
            <UserPlusIcon className="mr-2 h-4 w-4" /> Add Team Member
          </Link>
        </Button>
      </div>
      <TeamMemberList members={members} currentUserId={user.id} />
    </DashboardShell>
  )
}
