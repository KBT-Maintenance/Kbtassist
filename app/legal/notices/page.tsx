import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircleIcon } from "lucide-react"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getNoticesForUser } from "@/lib/actions"
import type { UserRole } from "@prisma/client"
import { MyNoticesList } from "@/components/legal/my-notices-list"

export default async function LegalNoticesPage() {
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
    console.error("Failed to fetch notices:", error)
    return (
      <DashboardShell userRole={userRole}>
        <Card>
          <CardHeader>
            <CardTitle>Legal Notices</CardTitle>
            <CardDescription>Failed to load legal notices.</CardDescription>
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Legal Notices</h2>
        <Button asChild>
          <Link href="/legal/notices/create">
            <PlusCircleIcon className="mr-2 h-4 w-4" /> Create New Notice
          </Link>
        </Button>
      </div>
      <MyNoticesList notices={notices || []} />
    </DashboardShell>
  )
}
