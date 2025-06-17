import { DashboardShell } from "@/components/layout/dashboard-shell"
import { PropertyDetailsForm } from "@/components/property/property-details-form"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function AddPropertyPage() {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // You might want to check user role here to ensure only authorized users can add properties
  // For now, assuming any logged-in user can add.

  return (
    <DashboardShell>
      <h2 className="text-2xl font-bold mb-4">Add New Property</h2>
      <PropertyDetailsForm propertyId="New Property" /> {/* Use a special ID for new properties */}
    </DashboardShell>
  )
}
