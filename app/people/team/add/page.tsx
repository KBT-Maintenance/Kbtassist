"use client"

import React, { useState, useActionState } from "react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2Icon, UserPlusIcon } from "lucide-react"
import { addTeamMember } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { UserRole } from "@prisma/client"
import { useRouter } from "next/navigation"

export default function AddTeamMemberPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole | "">("") // State for selected role
  const [officeId, setOfficeId] = useState<string | undefined>(undefined) // Placeholder for office selection

  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  const [state, action, isPending] = useActionState(addTeamMember, null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive",
      })
      return
    }
    if (!name || !email || !role) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }
    action(user.id, name, email, role, officeId)
  }

  React.useEffect(() => {
    if (state?.success && !isPending) {
      toast({
        title: "Team Member Added!",
        description: state.message,
      })
      setName("")
      setEmail("")
      setRole("")
      setOfficeId(undefined)
      router.push("/people/team") // Redirect to team list
    } else if (state?.error && !isPending) {
      toast({
        title: "Error Adding Team Member",
        description: state.error,
        variant: "destructive",
      })
    }
  }, [state, isPending, toast, router])

  return (
    <DashboardShell>
      <h2 className="text-2xl font-bold mb-4">Add New Team Member</h2>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Team Member Details</CardTitle>
          <CardDescription>Enter the details for the new team member and send an invitation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@example.com"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={(value: UserRole) => setRole(value)} value={role} disabled={isPending}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.PROPERTY_MANAGER}>Property Manager</SelectItem>
                  <SelectItem value={UserRole.AGENT}>Agent</SelectItem>
                  {/* Add other relevant roles if needed, e.g., UserRole.ADMIN */}
                </SelectContent>
              </Select>
            </div>
            {/* Conceptual: Office selection */}
            <div>
              <Label htmlFor="office">Office (Optional)</Label>
              <Select onValueChange={setOfficeId} value={officeId} disabled={isPending}>
                <SelectTrigger id="office">
                  <SelectValue placeholder="Select office" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office1">Main Office</SelectItem>
                  <SelectItem value="office2">Branch A</SelectItem>
                  {/* Dynamically load offices from DB */}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <UserPlusIcon className="mr-2 h-4 w-4" /> Add Team Member
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
