import { DashboardShell } from "@/components/layout/dashboard-shell"
import { JobDetailsView } from "@/components/maintenance/job-details-view"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getMaintenanceJobDetails } from "@/lib/actions"

export default async function JobDetailsPage({ params }: { params: { jobId: string } }) {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { success, job, error } = await getMaintenanceJobDetails(params.jobId)

  if (!success || !job) {
    console.error("Failed to fetch job details:", error)
    return (
      <DashboardShell>
        <h2 className="text-2xl font-bold mb-4">Job Not Found</h2>
        <p className="text-red-500">Error loading job details: {error || "Job not found."}</p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <h2 className="text-2xl font-bold mb-4">Job Details: {job.title}</h2>
      <JobDetailsView job={job} currentUserId={user.id} />
    </DashboardShell>
  )
}
