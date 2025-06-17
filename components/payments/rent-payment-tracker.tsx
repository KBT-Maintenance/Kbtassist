"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchIcon, FilterIcon, DollarSignIcon, CheckCircleIcon, Loader2Icon } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { PaymentStatus, UserRole } from "@prisma/client"
import { markPaymentAsPaid, createCheckoutSession } from "@/lib/actions/payments" // Assuming these are server actions
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"

interface RentPaymentTrackerProps {
  initialPayments: any[] // Replace 'any' with actual RentPayment type
}

export function RentPaymentTracker({ initialPayments }: RentPaymentTrackerProps) {
  const [payments, setPayments] = useState(initialPayments)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | "all">("all")
  const [filterProperty, setFilterProperty] = useState("all")
  const [loadingPaymentAction, setLoadingPaymentAction] = useState<string | null>(null) // To track which payment is being processed

  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const currentUserRole = (user?.user_metadata?.role || "GUEST") as UserRole

  // Extract unique properties for filter
  const allProperties = Array.from(
    new Set(payments.map((p) => `${p.property?.address}, ${p.property?.postcode}`)),
  ).sort()

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.property?.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.property?.postcode.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || payment.status === filterStatus
    const matchesProperty =
      filterProperty === "all" || `${payment.property?.address}, ${payment.property?.postcode}` === filterProperty

    return matchesSearch && matchesStatus && matchesProperty
  })

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

  const handleMarkAsPaid = async (paymentId: string) => {
    setLoadingPaymentAction(paymentId)
    const { success, error } = await markPaymentAsPaid(paymentId)
    if (success) {
      toast({ title: "Success", description: "Payment marked as paid." })
      // Update local state to reflect the change
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, status: PaymentStatus.PAID } : p)))
    } else {
      toast({ title: "Error", description: error || "Failed to mark payment as paid.", variant: "destructive" })
    }
    setLoadingPaymentAction(null)
  }

  const handlePayNow = async (paymentId: string, amount: number) => {
    setLoadingPaymentAction(paymentId)
    const { success, sessionId, error } = await createCheckoutSession(paymentId, amount)
    if (success && sessionId) {
      // Redirect to Stripe Checkout
      router.push(`https://checkout.stripe.com/pay/${sessionId}`)
    } else {
      toast({ title: "Error", description: error || "Failed to initiate payment.", variant: "destructive" })
    }
    setLoadingPaymentAction(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rent Payment Tracker</CardTitle>
        <CardDescription>Monitor and manage rent payments for your properties.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by tenant or property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select onValueChange={(value: PaymentStatus | "all") => setFilterStatus(value)} value={filterStatus}>
            <SelectTrigger className="w-full md:w-[180px]">
              <FilterIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.values(PaymentStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setFilterProperty} value={filterProperty}>
            <SelectTrigger className="w-full md:w-[180px]">
              <FilterIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by Property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {allProperties.map((property) => (
                <SelectItem key={property} value={property}>
                  {property}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No rent payments found matching your criteria.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.tenant?.name || "N/A"}</TableCell>
                  <TableCell>
                    {payment.property?.address}, {payment.property?.postcode}
                  </TableCell>
                  <TableCell>£{payment.amount.toFixed(2)}</TableCell>
                  <TableCell>{format(new Date(payment.dueDate), "dd MMM yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(payment.status)}>{payment.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {currentUserRole === UserRole.TENANT && payment.status !== PaymentStatus.PAID && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handlePayNow(payment.id, payment.amount)}
                        disabled={loadingPaymentAction === payment.id}
                      >
                        {loadingPaymentAction === payment.id ? (
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <DollarSignIcon className="mr-2 h-4 w-4" />
                        )}
                        Pay Now
                      </Button>
                    )}
                    {(currentUserRole === UserRole.AGENT ||
                      currentUserRole === UserRole.LANDLORD ||
                      currentUserRole === UserRole.PROPERTY_MANAGER) &&
                      payment.status !== PaymentStatus.PAID && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsPaid(payment.id)}
                          disabled={loadingPaymentAction === payment.id}
                        >
                          {loadingPaymentAction === payment.id ? (
                            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <DollarSignIcon className="mr-2 h-4 w-4" />
                          )}
                          Pay Now
                        </Button>
                      )}
                    {(currentUserRole === UserRole.AGENT ||
                      currentUserRole === UserRole.LANDLORD ||
                      currentUserRole === UserRole.PROPERTY_MANAGER) &&
                      payment.status !== PaymentStatus.PAID && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsPaid(payment.id)}
                          disabled={loadingPaymentAction === payment.id}
                        >
                          {loadingPaymentAction === payment.id ? (
                            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircleIcon className="mr-2 h-4 w-4" />
                          )}
                          Mark as Paid
                        </Button>
                      )}
                    utton> )}
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
