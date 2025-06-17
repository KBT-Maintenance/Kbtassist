"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HomeIcon,
  BuildingIcon,
  UsersIcon,
  WrenchIcon,
  DollarSignIcon,
  FileTextIcon,
  MessageSquareIcon,
  CalendarIcon,
  SettingsIcon,
  MenuIcon,
  LogOutIcon,
  LightbulbIcon,
  ScaleIcon,
  UserRoundCogIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  BriefcaseBusinessIcon,
  LandmarkIcon,
  MegaphoneIcon,
  WalletCardsIcon,
  FileBarChartIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/components/auth/auth-provider"
import { UserRole } from "@prisma/client"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"
import { Toaster } from "@/components/ui/toaster"

interface DashboardShellProps {
  children: React.ReactNode
  userRole?: string // Optional prop to explicitly pass role if needed, otherwise derived from auth
}

export function DashboardShell({ children, userRole: propUserRole }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  // Determine user role, prioritizing prop, then auth context, then default to GUEST
  const currentUserRole = (propUserRole || user?.user_metadata?.role || "GUEST").toUpperCase() as UserRole

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboardIcon,
      roles: [UserRole.AGENT, UserRole.LANDLORD, UserRole.PROPERTY_MANAGER, UserRole.TENANT, UserRole.CONTRACTOR],
    },
    {
      href: "/properties",
      label: "Properties",
      icon: BuildingIcon,
      roles: [UserRole.AGENT, UserRole.LANDLORD, UserRole.PROPERTY_MANAGER],
      subItems: [
        { href: "/properties/my", label: "My Properties" },
        { href: "/properties/add", label: "Add New Property" },
        { href: "/properties/bulk-upload", label: "Bulk Upload" },
      ],
    },
    {
      href: "/people/tenants",
      label: "Tenants",
      icon: UsersIcon,
      roles: [UserRole.AGENT, UserRole.LANDLORD, UserRole.PROPERTY_MANAGER],
      subItems: [{ href: "/people/tenants", label: "All Tenants" }],
    },
    {
      href: "/people/contractors",
      label: "Contractors",
      icon: WrenchIcon,
      roles: [UserRole.AGENT, UserRole.LANDLORD, UserRole.PROPERTY_MANAGER],
      subItems: [
        { href: "/contractors/marketplace", label: "Marketplace" },
        { href: "/contractors/add", label: "Add Private Contractor" },
      ],
    },
    {
      href: "/my-jobs",
      label: "My Jobs",
      icon: BriefcaseBusinessIcon,
      roles: [UserRole.CONTRACTOR],
    },
    {
      href: "/tenant-dashboard",
      label: "My Home",
      icon: HomeIcon,
      roles: [UserRole.TENANT],
    },
    {
      href: "/issues/all",
      label: "Maintenance & Issues",
      icon: ClipboardListIcon,
      roles: [UserRole.AGENT, UserRole.LANDLORD, UserRole.PROPERTY_MANAGER, UserRole.TENANT, UserRole.CONTRACTOR],
      subItems: [
        { href: "/create-issue", label: "Report New Issue" },
        { href: "/issues/all", label: "All Issues" },
        { href: "/issues/my", label: "Issues Assigned to Me" },
        { href: "/issues/reported-by-me", label: "Issues Reported by Me" },
        { href: "/planned-maintenance", label: "Planned Maintenance" },
      ],
    },
    {
      href: "/payments/rent",
      label: "Payments",
      icon: DollarSignIcon,
      roles: [UserRole.AGENT, UserRole.LANDLORD, UserRole.PROPERTY_MANAGER, UserRole.TENANT],
      subItems: [
        { href: "/payments/rent", label: "Rent Payments" },
        { href: "/network-invoices", label: "Network Invoices" },
      ],
    },
    {
      href: "/legal/notices",
      label: "Legal & Notices",
      icon: ScaleIcon,
      roles: [UserRole.AGENT, UserRole.LANDLORD, UserRole.PROPERTY_MANAGER, UserRole.TENANT],
      subItems: [
        { href: "/legal/notices", label: "All Notices" },
        { href: "/legal/notices/my", label: "My Notices" },
      ],
    },
    {
      href: "/documents/shared",
      label: "Documents",
      icon: FileTextIcon,
      roles: [UserRole.AGENT, UserRole.LANDLORD, UserRole.PROPERTY_MANAGER, UserRole.TENANT, UserRole.CONTRACTOR],
      subItems: [{ href: "/documents/shared", label: "Shared Documents" }],
    },
    {
      href: "/messages",
      label: "Messages",
      icon: MessageSquareIcon,
      roles: [UserRole.AGENT, UserRole.LANDLORD, UserRole.PROPERTY_MANAGER, UserRole.TENANT, UserRole.CONTRACTOR],
    },
    {
      href: "/calendar/view",
      label: "Calendar",
      icon: CalendarIcon,
      roles: [UserRole.AGENT, UserRole.LANDLORD, UserRole.PROPERTY_MANAGER, UserRole.CONTRACTOR],
      subItems: [
        { href: "/calendar/view", label: "View Calendar" },
        { href: "/calendar/appointments", label: "Appointments" },
      ],
    },
    {
      href: "/reports",
      label: "Reports",
      icon: FileBarChartIcon,
      roles: [UserRole.AGENT, UserRole.LANDLORD, UserRole.PROPERTY_MANAGER],
    },
    {
      href: "/ai-insights",
      label: "AI Insights",
      icon: LightbulbIcon,
      roles: [UserRole.AGENT, UserRole.LANDLORD, UserRole.PROPERTY_MANAGER],
    },
    {
      href: "/promote",
      label: "Promote",
      icon: MegaphoneIcon,
      roles: [UserRole.CONTRACTOR],
    },
    {
      href: "/pricing",
      label: "Pricing",
      icon: WalletCardsIcon,
      roles: [UserRole.AGENT, UserRole.LANDLORD, UserRole.PROPERTY_MANAGER, UserRole.TENANT, UserRole.CONTRACTOR],
    },
    {
      href: "/people/team",
      label: "Team",
      icon: UserRoundCogIcon,
      roles: [UserRole.AGENT, UserRole.PROPERTY_MANAGER],
      subItems: [
        { href: "/people/team", label: "Manage Team" },
        { href: "/people/team/add", label: "Add Team Member" },
      ],
    },
    {
      href: "/people/landlords",
      label: "Landlords",
      icon: LandmarkIcon,
      roles: [UserRole.AGENT, UserRole.PROPERTY_MANAGER],
    },
    {
      href: "/settings/account",
      label: "Settings",
      icon: SettingsIcon,
      roles: [UserRole.AGENT, UserRole.LANDLORD, UserRole.PROPERTY_MANAGER, UserRole.TENANT, UserRole.CONTRACTOR],
      subItems: [
        { href: "/settings/account", label: "Account" },
        { href: "/settings/users", label: "Users" },
        { href: "/settings/property", label: "Property Defaults" },
      ],
    },
  ]

  const filteredNavItems = navItems.filter((item) => item.roles.includes(currentUserRole))

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <BuildingIcon className="h-6 w-6" />
              <span className="">KBT Assist</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {filteredNavItems.map((item) => (
                <React.Fragment key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                      pathname === item.href && "bg-muted text-primary",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                  {item.subItems &&
                    item.subItems.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg pl-9 pr-3 py-2 text-muted-foreground transition-all hover:text-primary",
                          pathname === subItem.href && "bg-muted text-primary",
                        )}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                </React.Fragment>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4 border-t flex justify-between items-center">
            <ModeToggle />
            <Button variant="ghost" onClick={signOut} className="text-sm">
              <LogOutIcon className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
                  <BuildingIcon className="h-6 w-6" />
                  <span className="sr-only">KBT Assist</span>
                </Link>
                {filteredNavItems.map((item) => (
                  <React.Fragment key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                        pathname === item.href && "bg-muted text-foreground",
                      )}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                    {item.subItems &&
                      item.subItems.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "mx-[-0.65rem] flex items-center gap-4 rounded-xl pl-10 pr-3 py-2 text-muted-foreground hover:text-foreground",
                            pathname === subItem.href && "bg-muted text-foreground",
                          )}
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                  </React.Fragment>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 p-4 border-t">
                <ModeToggle />
                <Button variant="ghost" onClick={signOut} className="text-sm">
                  <LogOutIcon className="mr-2 h-4 w-4" /> Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <BuildingIcon className="h-6 w-6" />
            <span className="">KBT Assist</span>
          </Link>
          <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder-user.jpg"} />
                    <AvatarFallback>{user?.user_metadata?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.user_metadata?.name || "My Account"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/account">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
          <Toaster />
        </main>
      </div>
    </div>
  )
}
