"use client"

import type React from "react"
import { useState, useActionState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2Icon, UserPlusIcon } from "lucide-react"
import { addTenant } from "@/lib/actions/tenant" // Assuming this is your tenant-specific action
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TenantStatus } from "@prisma/client"

interface AddTenantFormProps {
  propertyId: string
}

export function AddTenantForm({ propertyId }: AddTenantFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [status, setStatus] = useState<TenantStatus>(TenantStatus.PENDING) // Default status

  const { toast } = useToast()
  const router = useRouter()

  const [state, action, isPending] = useActionState(addTenant, null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !phone || !status) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }
    action(propertyId, name, email, phone, status)
  }

  useEffect(() => {
    if (state?.success && !isPending) {
      toast({
        title: "Tenant Added!",
        description: state.message,
      })
      setName("")
      setEmail("")
      setPhone("")
      setStatus(TenantStatus.PENDING)
      router.push(`/properties/${propertyId}/dashboard`) // Redirect to property dashboard
    } else if (state?.error && !isPending) {
      toast({
        title: "Error Adding Tenant",
        description: state.error,
        variant: "destructive",
      })
    }
  }, [state, isPending, toast, router, propertyId])

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Add New Tenant</CardTitle>
        <CardDescription>Enter the details for the new tenant for this property.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tenant Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
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
              placeholder="john.doe@example.com"
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
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value: TenantStatus) => setStatus(value)} value={status} disabled={isPending}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TenantStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={TenantStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={TenantStatus.INACTIVE}>Inactive</SelectItem>
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
                <UserPlusIcon className="mr-2 h-4 w-4" /> Add Tenant
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
