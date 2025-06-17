import { DashboardShell } from "@/components/layout/dashboard-shell"
import { InventoryCheckoutAnalyzer } from "@/components/property/inventory-checkout-analyzer"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getPropertyDetails } from "@/lib/actions"

export default async function PropertyInventoryAnalysisPage({ params }: { params: { propertyId: string } }) {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { success, property, error } = await getPropertyDetails(params.propertyId)

  if (!success || !property) {
    console.error("Failed to fetch property details for inventory analysis:", error)
    return (
      <DashboardShell>
        <h2 className="text-2xl font-bold mb-4">Property Not Found</h2>
        <p className="text-red-500">Error loading property details: {error || "Property not found."}</p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <h2 className="text-2xl font-bold mb-4">Inventory Checkout Analysis for {property.address}</h2>
      <InventoryCheckoutAnalyzer propertyId={params.propertyId} />
    </DashboardShell>
  )
}
