import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { NoticeStatus } from "@prisma/client"

interface PropertyLegalNoticesProps {
  notices: any[] // Replace 'any' with actual Notice type from Prisma schema
  error: string | null
}

export function PropertyLegalNotices({ notices, error }: PropertyLegalNoticesProps) {
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Notices</CardTitle>
          <CardDescription>Failed to load legal notices for this property.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadgeVariant = (status: NoticeStatus) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal Notices</CardTitle>
        <CardDescription>All legal notices issued for or related to this property.</CardDescription>
      </CardHeader>
      <CardContent>
        {notices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No legal notices found for this property.</p>
            <Button asChild className="mt-4">
              <Link href={`/properties/${notices[0]?.propertyId || "some-property-id"}/notices`}>Send New Notice</Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notices.map((notice) => (
                <TableRow key={notice.id}>
                  <TableCell className="font-medium">{notice.title}</TableCell>
                  <TableCell>{notice.recipientEmail}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(notice.status)}>{notice.status.replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(notice.createdAt), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/legal/notices/${notice.id}`}>View Details</Link>
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
