import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getPropertiesForUser } from "@/lib/actions" // Import the action
import { getServerSupabaseClient } from "@/lib/supabase-server" // Import server Supabase client

export default async function MyPropertiesPage() {
  const supabase = getServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    // Handle unauthenticated state, e.g., redirect to login or show a message
    return (
      <DashboardShell>
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please log in to view your properties.</p>
            <Button asChild className="mt-4">
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  const userId = session.user.id
  const userRole = (session.user.user_metadata?.role || "AGENT").toUpperCase() // Ensure role is uppercase for enum

  const { success, properties, error } = await getPropertiesForUser(userId, userRole)

  if (!success) {
    return (
      <DashboardShell userRole={userRole.toLowerCase()}>
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error || "Failed to load properties. Please try again."}</p>
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell userRole={userRole.toLowerCase()}>
      <Card>
        <CardHeader>
          <CardTitle>My Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">This page lists all properties managed by you.</p>
          {properties && properties.length > 0 ? (
            <ul className="space-y-2">
              {properties.map((property) => (
                <li key={property.id} className="flex items-center justify-between">
                  <span>
                    {property.address}, {property.postcode}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/properties/${property.id}/dashboard`}>Dashboard</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/properties/${property.id}/compliance`}>Compliance</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/properties/${property.id}/add-tenant`}>Add Tenant</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No properties found for your account yet.</p>
          )}
          <Button className="mt-4" asChild>
            <Link href="/properties/add">Add New Property</Link>
          </Button>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
