"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { HomeIcon, DollarSignIcon, WrenchIcon, Loader2Icon, PlusCircleIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { JobStatus, PaymentStatus, NoticeStatus, UserRole } from "@prisma/client"

interface TenantDashboardClientPageProps {
  initialData: {
    tenant: {
      id: string
      name: string
      email: string
      phone: string | null
      status: string // Assuming this maps to TenantStatus
    }
    property: {
      id: string
      address: string
      postcode: string
      rentAmount: number
      landlord: { name: string } | null
      assignedManager: { name: string } | null
    }
    reportedJobs: any[] // Replace 'any' with actual Job type
    rentPayments: any[] // Replace 'any' with actual RentPayment type
    sharedDocuments: any[] // Replace 'any' with actual Document type
    notices: any[] // Replace 'any' with actual Notice type
  }
  currentUserId: string
}

export default function TenantDashboardClientPage({ initialData, currentUserId }: TenantDashboardClientPageProps) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false) // For potential client-side re-fetches

  // Helper to get badge variant for job status
  const getJobStatusBadgeVariant = (status: JobStatus) => {
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

  // Helper to get badge variant for payment status
  const getPaymentStatusBadgeVariant = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return "success"
      case PaymentStatus.PENDING:
        return "secondary"
      case PaymentStatus.OVERDUE:
        return "destructive"
      default:
        return "secondary"
    }
  }

  // Helper to get badge variant for notice status
  const getNoticeStatusBadgeVariant = (status: NoticeStatus) => {
    switch (status) {
      case NoticeStatus.SENT:
        return "default"
      case NoticeStatus.DELIVERED:
        return "success"
      case NoticeStatus.VIEWED:
        return "secondary"
      case NoticeStatus.ACTION_REQUIRED:
        return "destructive"
      case NoticeStatus.RESOLVED:
        return "outline"
      default:
        return "secondary"
    }
  }

  if (loading) {
    return (
      <DashboardShell userRole={UserRole.TENANT}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2Icon className="h-8 w-8 animate-spin" />
          <p className="ml-2">Loading your dashboard...</p>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell userRole={UserRole.TENANT}>
      <h2 className="text-2xl font-bold mb-4">Welcome, {data.tenant.name}!</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Property Overview Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Property</CardTitle>
            <HomeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.property.address}</div>
            <p className="text-xs text-muted-foreground">{data.property.postcode}</p>
            <p className="text-xs text-muted-foreground mt-2">Rent: £{data.property.rentAmount.toFixed(2)}/month</p>
            <p className="text-xs text-muted-foreground">Landlord: {data.property.landlord?.name || "N/A"}</p>
            <p className="text-xs text-muted-foreground">Manager: {data.property.assignedManager?.name || "N/A"}</p>
            <Button asChild variant="link" className="p-0 h-auto mt-2">
              <Link href={`/properties/${data.property.id}/details`}>View Property Details</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Rent Payments Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rent Payments</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.rentPayments && data.rentPayments.length > 0 ? (
              <>
                <p className="text-2xl font-bold">
                  {data.rentPayments.filter((p) => p.status === PaymentStatus.OVERDUE).length} Overdue
                </p>
                <p className="text-xs text-muted-foreground">
                  Next due:{" "}
                  {data.rentPayments.find((p) => p.status === PaymentStatus.PENDING)?.dueDate
                    ? format(
                        new Date(data.rentPayments.find((p) => p.status === PaymentStatus.PENDING).dueDate),
                        "dd MMM yyyy",
                      )
                    : "N/A"}
                </p>
                <Button asChild variant="link" className="p-0 h-auto mt-2">
                  <Link href="/payments/rent">View All Payments</Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No payment records found.</p>
            )}
          </CardContent>
        </Card>

        {/* Reported Issues Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Reported Issues</CardTitle>
            <WrenchIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.reportedJobs && data.reportedJobs.length > 0 ? (
              <>
                <p className="text-2xl font-bold">
                  {data.reportedJobs.filter((job) => job.status !== JobStatus.COMPLETED).length} Open Issues
                </p>
                <p className="text-xs text-muted-foreground">
                  Last reported:{" "}
                  {data.reportedJobs[0]?.createdAt
                    ? format(new Date(data.reportedJobs[0].createdAt), "dd MMM yyyy")
                    : "N/A"}
                </p>
                <Button asChild variant="link" className="p-0 h-auto mt-2">
                  <Link href="/issues/reported-by-me">View All Issues</Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No issues reported by you yet.</p>
            )}
            <Button asChild variant="link" className="p-0 h-auto mt-2 block">
              <Link href="/create-issue">
                <PlusCircleIcon className="mr-1 h-4 w-4" /> Report New Issue
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Lists */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Shared Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Shared Documents</CardTitle>
            <CardDescription>Important documents shared with you for this property.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.sharedDocuments && data.sharedDocuments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.sharedDocuments.slice(0, 5).map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.name}</TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No documents shared with you yet.</p>
            )}
            <Button asChild variant="link" className="p-0 h-auto mt-2">
              <Link href="/documents/shared">View All Documents</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Legal Notices */}
        <Card>
          <CardHeader>
            <CardTitle>Legal Notices</CardTitle>
            <CardDescription>Notices issued to you or related to your property.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.notices && data.notices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Issued On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.notices.slice(0, 5).map((notice) => (
                    <TableRow key={notice.id}>
                      <TableCell>{notice.title}</TableCell>
                      <TableCell>
                        <Badge variant={getNoticeStatusBadgeVariant(notice.status)}>{notice.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{format(new Date(notice.createdAt), "dd MMM yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No legal notices found for you.</p>
            )}
            <Button asChild variant="link" className="p-0 h-auto mt-2">
              <Link href="/legal/notices/my">View All Notices</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
