import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PlusCircleIcon, HomeIcon } from "lucide-react"
import Link from "next/link"
import { getPropertiesForUser } from "@/lib/actions"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function PropertiesPage() {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !userProfile?.role) {
    console.error("User profile or role not found:", profileError)
    redirect("/dashboard") // Redirect if role is not found
  }

  const { properties, error: propertiesError } = await getPropertiesForUser(user.id, userProfile.role)

  if (propertiesError) {
    console.error("Failed to fetch properties:", propertiesError)
    return (
      <DashboardShell userRole={userProfile.role}>
        <h2 className="text-2xl font-bold mb-4">Your Properties</h2>
        <p className="text-red-500">Error loading properties: {propertiesError}</p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell userRole={userProfile.role}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Your Properties</h2>
        <Button asChild>
          <Link href="/properties/add">
            <PlusCircleIcon className="mr-2 h-4 w-4" /> Add New Property
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property List</CardTitle>
          <CardDescription>Overview of all properties you manage or are associated with.</CardDescription>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <HomeIcon className="h-12 w-12 mb-4" />
              <p className="text-lg">No properties found.</p>
              <p className="text-sm">Start by adding your first property.</p>
              <Button asChild className="mt-4">
                <Link href="/properties/add">Add Property</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Postcode</TableHead>
                  <TableHead>Rent (£/month)</TableHead>
                  <TableHead>Bedrooms</TableHead>
                  <TableHead>Bathrooms</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.address}</TableCell>
                    <TableCell>{property.postcode}</TableCell>
                    <TableCell>£{property.rent.toFixed(2)}</TableCell>
                    <TableCell>{property.bedrooms}</TableCell>
                    <TableCell>{property.bathrooms}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/properties/${property.id}/details`}>View Details</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
