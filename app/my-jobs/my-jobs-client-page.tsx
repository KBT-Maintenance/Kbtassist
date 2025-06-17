"use client"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { WrenchIcon, Loader2Icon } from "lucide-react"
import { JobStatus, type UserRole } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface MyJobsClientPageProps {
  initialJobs: any[] // Replace 'any' with actual Job type
  currentUserId: string
  userRole: UserRole
}

export default function MyJobsClientPage({ initialJobs, currentUserId, userRole }: MyJobsClientPageProps) {
  const [jobs, setJobs] = useState(initialJobs)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // This client component might re-fetch or handle real-time updates
    // For now, it just uses initialJobs.
    // If you want client-side fetching, you'd uncomment and implement:
    /*
    async function fetchJobs() {
      setLoading(true);
      const { success, jobs: fetchedJobs, error: fetchError } = await getContractorJobs(currentUserId);
      if (success) {
        setJobs(fetchedJobs);
      } else {
        setError(fetchError || "Failed to load jobs.");
      }
      setLoading(false);
    }
    fetchJobs();
    */
  }, [currentUserId])

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

  if (loading) {
    return (
      <DashboardShell userRole={userRole}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2Icon className="h-8 w-8 animate-spin" />
          <p className="ml-2">Loading jobs...</p>
        </div>
      </DashboardShell>
    )
  }

  if (error) {
    return (
      <DashboardShell userRole={userRole}>
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell userRole={userRole}>
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
