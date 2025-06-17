import { Button } from "@/components/ui/button"
import { Suspense } from "react"
import { MetricCard } from "@/components/dashboard/metric-card"
import { StatusGridCard } from "@/components/dashboard/status-grid-card"
import { IssueListCard } from "@/components/dashboard/issue-list-card"
import { AddPanelButton } from "@/components/dashboard/add-panel-button"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import {
  getMaintenanceJobsForUser,
  getPropertiesForUser,
  getAllRentPaymentsForUser,
  getNoticesForUser,
} from "@/lib/actions"
import { UserRole, JobStatus, PaymentStatus, TenantStatus } from "@prisma/client"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import {
  PlusCircleIcon,
  HomeIcon,
  ReceiptTextIcon,
  ScaleIcon,
  WrenchIcon,
  DollarSignIcon,
  UsersIcon,
  StoreIcon,
  Loader2Icon,
} from "lucide-react"

export default async function DashboardPage() {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const userRole = (user.user_metadata?.role || "GUEST") as UserRole

  // Fetch data for various cards based on user role
  const { jobs, error: jobsError } = await getMaintenanceJobsForUser(user.id, userRole)
  const { properties, error: propertiesError } = await getPropertiesForUser(user.id, userRole)
  const { payments, error: paymentsError } = await getAllRentPaymentsForUser(user.id, userRole)
  const { notices, error: noticesError } = await getNoticesForUser(user.id, userRole)

  if (jobsError || propertiesError || paymentsError || noticesError) {
    console.error("Dashboard data fetch errors:", { jobsError, propertiesError, paymentsError, noticesError })
    // Handle error gracefully, perhaps show a partial dashboard or an error message
  }

  // Process data for Metric Cards
  const reportedIssuesToDo = jobs?.filter((job) => job.status === JobStatus.REPORTED).length || 0
  const issuesRequiringAttention =
    jobs?.filter((job) =>
      [JobStatus.PENDING_QUOTE, JobStatus.QUOTE_SUBMITTED, JobStatus.AWAITING_APPROVAL].includes(job.status),
    ).length || 0
  const openIssues =
    jobs?.filter((job) =>
      [
        JobStatus.REPORTED,
        JobStatus.ACKNOWLEDGED,
        JobStatus.PENDING_QUOTE,
        JobStatus.QUOTE_SUBMITTED,
        JobStatus.AWAITING_APPROVAL,
        JobStatus.IN_PROGRESS,
      ].includes(job.status),
    ).length || 0

  // Process data for Status Grid Card (simplified for example)
  const statusGridData = [
    [reportedIssuesToDo, 0, 0, 0], // Reported
    [0, issuesRequiringAttention, 0, 0], // Requiring Attention
    [0, 0, jobs?.filter((job) => job.status === JobStatus.IN_PROGRESS).length || 0, 0], // In Progress
    [0, 0, 0, jobs?.filter((job) => job.status === JobStatus.COMPLETED).length || 0], // Completed
  ]
  const statusGridColors = [
    "bg-blue-600", // Reported
    "bg-purple-600", // Requiring Attention
    "bg-orange-600", // In Progress
    "bg-green-600", // Completed
  ]

  // Process data for Issue List Cards
  const commentsReceived =
    jobs?.slice(0, 6).map((job) => ({
      id: job.id,
      description: job.title,
      timeframe: `${Math.floor((new Date().getTime() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago`,
    })) || []

  const recentlyProgressed =
    jobs
      ?.filter((job) => job.status !== JobStatus.REPORTED && job.status !== JobStatus.COMPLETED)
      .slice(0, 6)
      .map((job) => ({
        id: job.id,
        description: job.title,
        status: job.status,
        count: 0, // Placeholder, actual count logic would be more complex
      })) || []

  const quotesSubmitted =
    jobs
      ?.filter((job) => job.status === JobStatus.QUOTE_SUBMITTED)
      .slice(0, 6)
      .map((job) => ({
        id: job.id,
        description: job.title,
      })) || []

  const jobsAwaitingInvoice =
    jobs
      ?.filter((job) => job.status === JobStatus.COMPLETED)
      .slice(0, 6)
      .map((job) => ({
        id: job.id,
        description: job.title,
        date: new Date(job.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      })) || []

  const rentArrears = payments?.filter((p) => p.status === PaymentStatus.OVERDUE).length || 0
  const totalProperties = properties?.length || 0
  const activeTenants =
    properties?.reduce(
      (acc, prop) => acc + (prop.tenants?.filter((t: any) => t.status === TenantStatus.ACTIVE).length || 0),
      0,
    ) || 0

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <Loader2Icon className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Reported issues to do" value={reportedIssuesToDo} />
        <MetricCard title="Issues requiring attention" value={issuesRequiringAttention} />
        <MetricCard title="Open issues" value={openIssues} />
        <StatusGridCard title="Issues requiring attention, by status" data={statusGridData} colors={statusGridColors} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <IssueListCard title="Comments recently received" items={commentsReceived} />
        <IssueListCard title="Recently progressed" items={recentlyProgressed} />
        <IssueListCard title="Quotes submitted" items={quotesSubmitted} />
        <IssueListCard title="Jobs awaiting invoice" items={jobsAwaitingInvoice} />
      </div>

      {/* New Dashboard Cards for LL/Agent/PM */}
      {(userRole === UserRole.LANDLORD || userRole === UserRole.PROPERTY_MANAGER || userRole === UserRole.AGENT) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <HomeIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProperties}</div>
              <p className="text-xs text-muted-foreground">
                <Link href="/properties" className="underline">
                  View all properties
                </Link>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rent Arrears</CardTitle>
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rentArrears} overdue payments</div>
              <p className="text-xs text-muted-foreground">
                <Link href="/payments/rent" className="underline">
                  Manage payments
                </Link>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTenants}</div>
              <p className="text-xs text-muted-foreground">
                <Link href="/people/tenants" className="underline">
                  View all tenants
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions for LL/Agent/PM */}
      {(userRole === UserRole.LANDLORD || userRole === UserRole.PROPERTY_MANAGER || userRole === UserRole.AGENT) && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Perform common tasks quickly.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button asChild variant="outline">
              <Link href="/properties/add">
                <PlusCircleIcon className="mr-2 h-4 w-4" /> Add New Property
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/create-issue">
                <WrenchIcon className="mr-2 h-4 w-4" /> Report New Issue
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/legal/notices">
                <ScaleIcon className="mr-2 h-4 w-4" /> Send Legal Notice
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/payments/rent">
                <ReceiptTextIcon className="mr-2 h-4 w-4" /> View Rent Payments
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contractors/marketplace">
                <StoreIcon className="mr-2 h-4 w-4" /> Find Contractors
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/people/team">
                <UsersIcon className="mr-2 h-4 w-4" /> Manage Team
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <AddPanelButton />
    </Suspense>
  )
}
