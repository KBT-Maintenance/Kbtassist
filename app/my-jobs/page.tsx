import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { WrenchIcon } from "lucide-react"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getContractorJobs } from "@/lib/actions"
import { JobStatus, UserRole } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default async function MyJobsPage() {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const userRole = (user.user_metadata?.role || "GUEST") as UserRole

  if (userRole !== UserRole.CONTRACTOR) {
    redirect("/dashboard") // Only contractors can access this page
  }

  const { success, jobs, error } = await getContractorJobs(user.id)

  if (!success) {
    console.error("Failed to fetch contractor jobs:", error)
    return (
      <DashboardShell>
        <Card>
          <CardHeader>
            <CardTitle>My Jobs</CardTitle>
            <CardDescription>Failed to load your assigned jobs.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">Error: {error}. Please try again later.</p>
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  const getStatusBadgeVariant = (status: JobStatus) => {
    switch (status) {
      case JobStatus.REPORTED:
      case JobStatus.ACKNOWLEDGED:
        return "outline"
      case JobStatus.PENDING_QUOTE:
      case JobStatus.QUOTE_SUBMITTED:
      case JobStatus.AWAITING_APPROVAL:
        return "secondary"
      case JobStatus.IN_PROGRESS:
        return "default"
      case JobStatus.COMPLETED:
        return "success"
      case JobStatus.CANCELLED:
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <DashboardShell>
      <h2 className="text-2xl font-bold mb-4">My Assigned Jobs</h2>
      <Card>
        <CardHeader>
          <CardTitle>Job List</CardTitle>
          <CardDescription>Overview of all maintenance jobs assigned to you.</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <WrenchIcon className="h-12 w-12 mb-4" />
              <p className="text-lg">No jobs currently assigned to you.</p>
              <p className="text-sm">Check the marketplace for new opportunities.</p>
              <Button asChild className="mt-4">
                <Link href="/contractors/marketplace">Browse Marketplace</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>
                      {job.propertyAddress}, {job.propertyPostcode}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(job.status)}>{job.status.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(job.createdAt), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/issues/${job.id}`}>View Details</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
