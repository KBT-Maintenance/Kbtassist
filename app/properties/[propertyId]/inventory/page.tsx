import { DashboardShell } from "@/components/layout/dashboard-shell"
import { InventoryManager } from "@/components/property/inventory-manager"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getPropertyDetails } from "@/lib/actions"

export default async function PropertyInventoryPage({ params }: { params: { propertyId: string } }) {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { success, property, error } = await getPropertyDetails(params.propertyId)

  if (!success || !property) {
    console.error("Failed to fetch property details for inventory:", error)
    return (
      <DashboardShell>
        <h2 className="text-2xl font-bold mb-4">Property Not Found</h2>
        <p className="text-red-500">Error loading property details: {error || "Property not found."}</p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <h2 className="text-2xl font-bold mb-4">Inventory for {property.address}</h2>
      <InventoryManager propertyId={params.propertyId} />
    </DashboardShell>
  )
}
