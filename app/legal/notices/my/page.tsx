import { DashboardShell } from "@/components/layout/dashboard-shell"
import { MyNoticesList } from "@/components/legal/my-notices-list"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getNoticesForUser } from "@/lib/actions"
import type { UserRole } from "@prisma/client"

export default async function MyLegalNoticesPage() {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const userRole = user.user_metadata.role as UserRole

  const { success, notices, error } = await getNoticesForUser(user.id, userRole)

  if (!success) {
    console.error("Failed to fetch my notices:", error)
    return (
      <DashboardShell userRole={userRole}>
        <h2 className="text-2xl font-bold mb-4">My Legal Notices</h2>
        <p className="text-destructive">Error loading your notices: {error}. Please try again later.</p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell userRole={userRole}>
      <h2 className="text-2xl font-bold mb-4">My Legal Notices</h2>
      <MyNoticesList notices={notices || []} />
    </DashboardShell>
  )
}
