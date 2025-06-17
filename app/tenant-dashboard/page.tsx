import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { getUserDetails } from "@/lib/actions"
import { getTenantRentPayments } from "@/lib/actions"
import { getMaintenanceJobsForUser } from "@/lib/actions"
import { getTenantSharedDocuments } from "@/lib/actions"
import { getNoticesForUser } from "@/lib/actions"
import { getPropertyDetails } from "@/lib/actions"
import { UserRole } from "@prisma/client"
import TenantDashboardClientPage from "./tenant-dashboard-client-page"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export default async function TenantDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  const userId = session.user.id
  const userRole = session.user.role as UserRole

  if (userRole !== UserRole.TENANT) {
    redirect("/dashboard") // Redirect non-tenants
  }

  const { success: userSuccess, user } = await getUserDetails()
  if (!userSuccess || !user) {
    // Handle error or redirect
    redirect("/login")
  }

  // Fetch tenant-specific data
  const { success: tenantPaymentsSuccess, payments: rentPayments } = await getTenantRentPayments(user.id)
  const { success: reportedJobsSuccess, jobs: reportedJobs } = await getMaintenanceJobsForUser(userId, userRole)
  const { success: sharedDocumentsSuccess, documents: sharedDocuments } = await getTenantSharedDocuments(userId)
  const { success: noticesSuccess, notices } = await getNoticesForUser(userId, userRole)

  // Fetch property details associated with the tenant
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: tenantPropertyData, error: tenantPropertyError } = await supabase
    .from("tenants")
    .select("propertyId")
    .eq("userId", userId)
    .single()

  if (tenantPropertyError || !tenantPropertyData?.propertyId) {
    console.error("Tenant's property not found:", tenantPropertyError)
    // Handle case where tenant is not linked to a property
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
        <h2 className="text-2xl font-bold">No Property Assigned</h2>
        <p className="text-muted-foreground">
          It looks like you haven't been assigned to a property yet. Please contact your landlord or property manager.
        </p>
      </div>
    )
  }

  const { success: propertyDetailsSuccess, property } = await getPropertyDetails(tenantPropertyData.propertyId)

  if (
    !tenantPaymentsSuccess ||
    !reportedJobsSuccess ||
    !sharedDocumentsSuccess ||
    !noticesSuccess ||
    !propertyDetailsSuccess ||
    !property
  ) {
    // Handle data fetching errors
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
        <h2 className="text-2xl font-bold">Error Loading Dashboard</h2>
        <p className="text-muted-foreground">
          There was an issue fetching your dashboard data. Please try again later.
        </p>
      </div>
    )
  }

  const initialData = {
    tenant: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status, // Assuming user status maps to tenant status
    },
    property: {
      id: property.id,
      address: property.address,
      postcode: property.postcode,
      rentAmount: property.rentAmount,
      landlord: property.landlord,
      assignedManager: property.assignedManager,
    },
    reportedJobs: reportedJobs,
    rentPayments: rentPayments,
    sharedDocuments: sharedDocuments,
    notices: notices,
  }

  return <TenantDashboardClientPage initialData={initialData} currentUserId={userId} />
}
