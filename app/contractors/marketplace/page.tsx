import { DashboardShell } from "@/components/layout/dashboard-shell"
import { ContractorMarketplace } from "@/components/contractor/contractor-marketplace"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { getContractorsForMarketplace } from "@/lib/actions"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircleIcon } from "lucide-react"

export default async function ContractorMarketplacePage() {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const userRole = (user.user_metadata?.role || "GUEST") as UserRole

  // Only fetch marketplace contractors if the user is not a contractor
  let contractors = []
  if (userRole !== UserRole.CONTRACTOR) {
    const { success, contractors: fetchedContractors, error } = await getContractorsForMarketplace(user.id, userRole)
    if (success) {
      contractors = fetchedContractors
    } else {
      console.error("Failed to fetch contractors for marketplace:", error)
      // Handle error, maybe show an empty state or error message
    }
  }

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Contractor Marketplace</h2>
        {(userRole === UserRole.LANDLORD || userRole === UserRole.PROPERTY_MANAGER || userRole === UserRole.AGENT) && (
          <Button asChild>
            <Link href="/contractors/add">
              <PlusCircleIcon className="mr-2 h-4 w-4" /> Add Private Contractor
            </Link>
          </Button>
        )}
      </div>
      <ContractorMarketplace initialContractors={contractors} userRole={userRole} currentUserId={user.id} />
    </DashboardShell>
  )
}
