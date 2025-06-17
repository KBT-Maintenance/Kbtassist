"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { JobStatus, JobPriority } from "@prisma/client"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchIcon, FilterIcon } from "lucide-react"

interface MaintenanceJobListProps {
  jobs: any[] // Replace 'any' with actual Job type from Prisma schema
}

export function MaintenanceJobList({ jobs: initialJobs }: MaintenanceJobListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<JobStatus | "all">("all")
  const [filterPriority, setFilterPriority] = useState<JobPriority | "all">("all")
  const [filteredJobs, setFilteredJobs] = useState(initialJobs)

  useEffect(() => {
    let currentJobs = initialJobs

    // Filter by search term
    if (searchTerm) {
      currentJobs = currentJobs.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by status
    if (filterStatus !== "all") {
      currentJobs = currentJobs.filter((job) => job.status === filterStatus)
    }

    // Filter by priority
    if (filterPriority !== "all") {
      currentJobs = currentJobs.filter((job) => job.priority === filterPriority)
    }

    setFilteredJobs(currentJobs)
  }, [searchTerm, filterStatus, filterPriority, initialJobs])

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
        <CardTitle>All Maintenance Issues</CardTitle>
        <CardDescription>A comprehensive list of all reported and ongoing maintenance jobs.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, or property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select onValueChange={(value: JobStatus | "all") => setFilterStatus(value)} value={filterStatus}>
            <SelectTrigger className="w-full md:w-[180px]">
              <FilterIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.values(JobStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={(value: JobPriority | "all") => setFilterPriority(value)} value={filterPriority}>
            <SelectTrigger className="w-full md:w-[180px]">
              <FilterIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {Object.values(JobPriority).map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No maintenance jobs found matching your criteria.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Reported On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>
                    {job.propertyAddress}, {job.propertyPostcode}
                  </TableCell>
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
