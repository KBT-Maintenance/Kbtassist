import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getNoticeDetails } from "@/lib/actions"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { format } from "date-fns"

export default async function NoticeDetailsPage({ params }: { params: { noticeId: string } }) {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { success, notice, error } = await getNoticeDetails(params.noticeId)

  if (!success || !notice) {
    console.error("Failed to fetch notice details:", error)
    return (
      <DashboardShell>
        <Card>
          <CardHeader>
            <CardTitle>Notice Not Found</CardTitle>
            <CardDescription>Could not load details for this notice.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">Error: {error || "Notice not found."}</p>
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <h2 className="text-2xl font-bold mb-4">Notice Details: {notice.title}</h2>
      <Card>
        <CardHeader>
          <CardTitle>{notice.title}</CardTitle>
          <CardDescription>
            Issued on: {format(new Date(notice.createdAt), "dd MMM yyyy")} | Status: {notice.status}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Recipient:</h3>
            <p>{notice.recipientEmail}</p>
          </div>
          <div>
            <h3 className="font-semibold">Property:</h3>
            <p>
              {notice.property?.address}, {notice.property?.postcode}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Content:</h3>
            <p>{notice.content}</p>
          </div>
          {notice.dueDate && (
            <div>
              <h3 className="font-semibold">Due Date:</h3>
              <p>{format(new Date(notice.dueDate), "dd MMM yyyy")}</p>
            </div>
          )}
          {/* Add more details as needed */}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
