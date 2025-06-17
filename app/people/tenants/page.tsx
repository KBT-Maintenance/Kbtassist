import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { UserPlusIcon, HomeIcon } from "lucide-react"
import { getAllTenantsForUser } from "@/lib/actions"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { TenantStatus } from "@prisma/client"
import { Badge } from "@/components/ui/badge"

export default async function TenantsPage() {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const userRole = user.user_metadata.role as string // Assuming role is always present

  const { success, tenants, error } = await getAllTenantsForUser(user.id, userRole)

  if (!success) {
    console.error("Failed to fetch tenants:", error)
    return (
      <DashboardShell userRole={userRole}>
        <Card>
          <CardHeader>
            <CardTitle>Your Tenants</CardTitle>
            <CardDescription>Failed to load tenant list.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">Error: {error}. Please try again later.</p>
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  const getStatusBadgeVariant = (status: TenantStatus) => {
    switch (status) {
      case TenantStatus.ACTIVE:
        return "success"
      case TenantStatus.PENDING:
        return "secondary"
      case TenantStatus.INACTIVE:
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <DashboardShell userRole={userRole}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Your Tenants</h2>
        <Button asChild>
          <Link href="/properties/add-tenant">
            <UserPlusIcon className="mr-2 h-4 w-4" /> Add New Tenant
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant List</CardTitle>
          <CardDescription>Overview of all tenants associated with your properties.</CardDescription>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <HomeIcon className="h-12 w-12 mb-4" />
              <p className="text-lg">No tenants found.</p>
              <p className="text-sm">Add tenants to your properties to get started.</p>
              <Button asChild className="mt-4">
                <Link href="/properties/add-tenant">Add Tenant</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.email}</TableCell>
                    <TableCell>
                      {tenant.property?.address}, {tenant.property?.postcode}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(tenant.status)}>{tenant.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/people/tenants/${tenant.id}/details`}>View Details</Link>
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
