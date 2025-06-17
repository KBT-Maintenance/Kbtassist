"use client"

import React, { useState, useActionState } from "react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2Icon, PlusCircleIcon } from "lucide-react"
import { addContractor } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"

export default function AddContractorPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [specialties, setSpecialties] = useState("")
  const [location, setLocation] = useState("")

  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  const [state, action, isPending] = useActionState(addContractor, null)

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
    if (!name || !email || !phone || !specialties || !location) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }
    const specialtiesArray = specialties
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    action(name, email, phone, specialtiesArray, location, user.id)
  }

  React.useEffect(() => {
    if (state?.success && !isPending) {
      toast({
        title: "Contractor Added!",
        description: state.message,
      })
      setName("")
      setEmail("")
      setPhone("")
      setSpecialties("")
      setLocation("")
      router.push("/contractors/marketplace") // Redirect to marketplace
    } else if (state?.error && !isPending) {
      toast({
        title: "Error Adding Contractor",
        description: state.error,
        variant: "destructive",
      })
    }
  }, [state, isPending, toast, router])

  return (
    <DashboardShell>
      <h2 className="text-2xl font-bold mb-4">Add New Private Contractor</h2>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Contractor Details</CardTitle>
          <CardDescription>
            Enter the details for a contractor you frequently use, but who isn't on the public marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Contractor Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ABC Plumbing"
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
                placeholder="info@abcplumbing.com"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 7123 456789"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="specialties">Specialties (comma-separated)</Label>
              <Input
                id="specialties"
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                placeholder="Plumbing, Heating, Gas Safety"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="location">Location / Service Area</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="London, SE1"
                required
                disabled={isPending}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <PlusCircleIcon className="mr-2 h-4 w-4" /> Add Contractor
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
