import { DashboardShell } from "@/components/layout/dashboard-shell"
import { RentPaymentTracker } from "@/components/payments/rent-payment-tracker"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getAllRentPaymentsForUser } from "@/lib/actions"
import type { UserRole } from "@prisma/client"

export default async function RentPaymentsPage() {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const userRole = user.user_metadata.role as UserRole

  const { success, payments, error } = await getAllRentPaymentsForUser(user.id, userRole)

  if (!success) {
    console.error("Failed to fetch rent payments:", error)
    return (
      <DashboardShell userRole={userRole}>
        <h2 className="text-2xl font-bold mb-4">Rent Payments</h2>
        <p className="text-destructive">Error loading rent payments: {error}. Please try again later.</p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell userRole={userRole}>
      <h2 className="text-2xl font-bold mb-4">Rent Payments</h2>
      <RentPaymentTracker initialPayments={payments || []} />
    </DashboardShell>
  )
}
