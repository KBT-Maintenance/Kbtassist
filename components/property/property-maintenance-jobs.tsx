import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { JobStatus } from "@prisma/client"

interface PropertyMaintenanceJobsProps {
  jobs: any[] // Replace 'any' with actual Job type from Prisma schema
  error: string | null
}

export function PropertyMaintenanceJobs({ jobs, error }: PropertyMaintenanceJobsProps) {
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Jobs</CardTitle>
          <CardDescription>Failed to load maintenance jobs for this property.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Jobs</CardTitle>
        <CardDescription>Overview of all maintenance requests for this property.</CardDescription>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No maintenance jobs found for this property.</p>
            <Button asChild className="mt-4">
              <Link href="/create-issue">Report New Issue</Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Reported On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(job.status)}>{job.status.replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell>{job.priority}</TableCell>
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
  )
}
