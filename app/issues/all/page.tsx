import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getMaintenanceJobsForUser } from "@/lib/actions"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { MaintenanceJobList } from "@/components/maintenance/maintenance-job-list"

export default async function AllIssuesPage() {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login") // Redirect to login if not authenticated
  }

  const userRole = user.user_metadata.role as string // Assuming role is always present

  const { success, jobs, error } = await getMaintenanceJobsForUser(user.id, userRole)

  if (!success) {
    console.error("Failed to fetch maintenance jobs:", error)
    return (
      <DashboardShell userRole={userRole}>
        <Card>
          <CardHeader>
            <CardTitle>All Issues</CardTitle>
            <CardDescription>Failed to load maintenance issues.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">Error: {error}. Please try again later.</p>
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell userRole={userRole}>
      <MaintenanceJobList jobs={jobs || []} />
    </DashboardShell>
  )
}
