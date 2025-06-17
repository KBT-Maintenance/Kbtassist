import { DashboardShell } from "@/components/layout/dashboard-shell"
import { SharedDocumentList } from "@/components/documents/shared-document-list"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSharedDocumentsForUser } from "@/lib/actions"
import type { UserRole } from "@prisma/client"

export default async function SharedDocumentsPage() {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const userRole = user.user_metadata.role as UserRole

  const { success, documents, error } = await getSharedDocumentsForUser(user.id, userRole)

  if (!success) {
    console.error("Failed to fetch shared documents:", error)
    return (
      <DashboardShell userRole={userRole}>
        <h2 className="text-2xl font-bold mb-4">Shared Documents</h2>
        <p className="text-destructive">Error loading shared documents: {error}. Please try again later.</p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell userRole={userRole}>
      <h2 className="text-2xl font-bold mb-4">Shared Documents</h2>
      <SharedDocumentList documents={documents || []} />
    </DashboardShell>
  )
}
