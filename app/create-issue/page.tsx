import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReportIssueForm } from "@/components/maintenance/report-issue-form"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { getPropertiesForUser } from "@/lib/actions"
import { redirect } from "next/navigation"

export default async function CreateIssuePage() {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login") // Redirect to login if not authenticated
  }

  // Fetch properties for the logged-in user
  const { success, properties, error } = await getPropertiesForUser(user.id, user.user_metadata.role)

  if (!success) {
    console.error("Failed to fetch properties for issue reporting:", error)
    // Handle error, maybe show a message to the user
    return (
      <DashboardShell userRole={user.user_metadata.role}>
        <Card>
          <CardHeader>
            <CardTitle>Create New Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">Failed to load properties: {error}. Please try again later.</p>
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell userRole={user.user_metadata.role}>
      <ReportIssueForm properties={properties || []} userId={user.id} />
    </DashboardShell>
  )
}
