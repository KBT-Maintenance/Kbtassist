import { DashboardShell } from "@/components/layout/dashboard-shell"
import { AddTenantForm } from "@/components/tenant/add-tenant-form"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getPropertyDetails } from "@/lib/actions"

export default async function AddTenantPage({ params }: { params: { propertyId: string } }) {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { success, property, error } = await getPropertyDetails(params.propertyId)

  if (!success || !property) {
    console.error("Failed to fetch property details for adding tenant:", error)
    return (
      <DashboardShell>
        <h2 className="text-2xl font-bold mb-4">Property Not Found</h2>
        <p className="text-red-500">Error loading property details: {error || "Property not found."}</p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <h2 className="text-2xl font-bold mb-4">Add New Tenant to {property.address}</h2>
      <AddTenantForm propertyId={params.propertyId} />
    </DashboardShell>
  )
}
