"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { EyeIcon, Loader2Icon } from "lucide-react"
import { getNoticesForUser } from "@/lib/actions"
import type { Notice as NoticeType } from "@prisma/client"
import { format } from "date-fns"
import Link from "next/link"

export function MyNoticesList() {
  const [notices, setNotices] = useState<NoticeType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true)
      setError(null)
      const result = await getNoticesForUser()
      if (result.success) {
        setNotices(result.data || [])
      } else {
        setError(result.error || "Failed to fetch notices.")
      }
      setLoading(false)
    }
    fetchNotices()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Legal Notices</CardTitle>
      </CardHeader>
      <CardContent>
        {notices.length === 0 ? (
          <p className="text-center text-gray-500">No legal notices found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Issued By</TableHead>
                <TableHead>Issued To</TableHead>
                <TableHead>Issued Date</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notices.map((notice) => (
                <TableRow key={notice.id}>
                  <TableCell className="font-medium">{notice.title}</TableCell>
                  <TableCell>{notice.noticeType}</TableCell>
                  <TableCell>{notice.property?.name || "N/A"}</TableCell>
                  <TableCell>{notice.issuedBy?.name || notice.issuedBy?.email || "Unknown"}</TableCell>
                  <TableCell>{notice.issuedTo?.name || notice.issuedTo?.email || "N/A"}</TableCell>
                  <TableCell>{format(new Date(notice.issuedDate), "dd MMM yyyy")}</TableCell>
                  <TableCell>{format(new Date(notice.effectiveDate), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/legal/notices/${notice.id}`}>
                        <EyeIcon className="h-4 w-4 mr-1" /> View
                      </Link>
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
