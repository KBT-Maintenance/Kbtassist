import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getPropertyDetails,
  getPropertyMaintenanceJobs,
  getPropertyTenants,
  getPropertyRentPayments,
  getPropertyLegalNotices,
} from "@/lib/actions"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { PropertyOverview } from "@/components/property/property-overview"
import { PropertyMaintenanceJobs } from "@/components/property/property-maintenance-jobs"
import { PropertyTenants } from "@/components/property/property-tenants"
import { PropertyRentPayments } from "@/components/property/property-rent-payments"
import { PropertyLegalNotices } from "@/components/property/property-legal-notices"

export default async function PropertyDashboardPage({ params }: { params: { propertyId: string } }) {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const propertyId = params.propertyId

  // Fetch all data concurrently
  const [
    { success: propertySuccess, property, error: propertyError },
    { success: jobsSuccess, jobs, error: jobsError },
    { success: tenantsSuccess, tenants, error: tenantsError },
    { success: paymentsSuccess, payments, error: paymentsError },
    { success: noticesSuccess, notices, error: noticesError },
  ] = await Promise.all([
    getPropertyDetails(propertyId),
    getPropertyMaintenanceJobs(propertyId),
    getPropertyTenants(propertyId),
    getPropertyRentPayments(propertyId),
    getPropertyLegalNotices(propertyId),
  ])

  if (!propertySuccess || !property) {
    console.error("Failed to fetch property details:", propertyError)
    return (
      <DashboardShell>
        <Card>
          <CardHeader>
            <CardTitle>Property Not Found</CardTitle>
            <CardDescription>Could not load details for this property.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">Error: {propertyError || "Property not found."}</p>
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <h2 className="text-2xl font-bold mb-4">Dashboard for {property.address}</h2>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notices">Notices</TabsTrigger>
          {/* <TabsTrigger value="inventory">Inventory</TabsTrigger> */}
        </TabsList>
        <TabsContent value="overview">
          <PropertyOverview property={property} />
        </TabsContent>
        <TabsContent value="maintenance">
          <PropertyMaintenanceJobs jobs={jobs || []} error={jobsError} />
        </TabsContent>
        <TabsContent value="tenants">
          <PropertyTenants tenants={tenants || []} error={tenantsError} />
        </TabsContent>
        <TabsContent value="payments">
          <PropertyRentPayments payments={payments || []} error={paymentsError} />
        </TabsContent>
        <TabsContent value="notices">
          <PropertyLegalNotices notices={notices || []} error={noticesError} />
        </TabsContent>
        {/* <TabsContent value="inventory">
          <PropertyInventoryAnalysisTab propertyId={propertyId} />
        </TabsContent> */}
      </Tabs>
    </DashboardShell>
  )
}
