import { DashboardShell } from "@/components/layout/dashboard-shell"
import { PricingTiers } from "@/components/pricing-tiers"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function PricingPage() {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // You might fetch current subscription status here to adjust UI
  return (
    <DashboardShell>
      <h2 className="text-2xl font-bold mb-4">Our Pricing Plans</h2>
      <PricingTiers />
    </DashboardShell>
  )
}
