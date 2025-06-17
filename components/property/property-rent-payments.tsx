import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { PaymentStatus } from "@prisma/client"

interface PropertyRentPaymentsProps {
  payments: any[] // Replace 'any' with actual RentPayment type from Prisma schema
  error: string | null
}

export function PropertyRentPayments({ payments, error }: PropertyRentPaymentsProps) {
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rent Payments</CardTitle>
          <CardDescription>Failed to load rent payments for this property.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadgeVariant = (status: PaymentStatus) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rent Payments</CardTitle>
        <CardDescription>Overview of rent payment history for this property.</CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No rent payment records found for this property.</p>
            {/* Potentially add a button to record a payment if applicable */}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.tenant?.name || "N/A"}</TableCell>
                  <TableCell>£{payment.amount.toFixed(2)}</TableCell>
                  <TableCell>{format(new Date(payment.dueDate), "dd MMM yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(payment.status)}>{payment.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/payments/rent/${payment.id}`}>View Details</Link>
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
