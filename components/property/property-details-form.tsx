"use client"

import React, { useState, useActionState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2Icon } from "lucide-react"
import { addProperty, updateProperty } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface PropertyDetailsFormProps {
  propertyId: string // "New Property" for add, actual ID for edit
  initialData?: {
    address: string
    postcode: string
    rent: number
    bedrooms: number
    bathrooms: number
    description?: string | null
  }
}

export function PropertyDetailsForm({ propertyId, initialData }: PropertyDetailsFormProps) {
  const isNewProperty = propertyId === "New Property"
  const [address, setAddress] = useState(initialData?.address || "")
  const [postcode, setPostcode] = useState(initialData?.postcode || "")
  const [rent, setRent] = useState(initialData?.rent.toString() || "")
  const [bedrooms, setBedrooms] = useState(initialData?.bedrooms.toString() || "")
  const [bathrooms, setBathrooms] = useState(initialData?.bathrooms.toString() || "")
  const [description, setDescription] = useState(initialData?.description || "")

  const { toast } = useToast()
  const router = useRouter()

  const [addState, addAction, addIsPending] = useActionState(addProperty, null)
  const [updateState, updateAction, updateIsPending] = useActionState(updateProperty, null)

  const isPending = addIsPending || updateIsPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const rentNum = Number.parseFloat(rent)
    const bedroomsNum = Number.parseInt(bedrooms, 10)
    const bathroomsNum = Number.parseInt(bathrooms, 10)

    if (isNaN(rentNum) || isNaN(bedroomsNum) || isNaN(bathroomsNum)) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid numbers for rent, bedrooms, and bathrooms.",
        variant: "destructive",
      })
      return
    }

    const propertyData = {
      address,
      postcode,
      rent: rentNum,
      bedrooms: bedroomsNum,
      bathrooms: bathroomsNum,
      description: description || null,
    }

    if (isNewProperty) {
      addAction(propertyData)
    } else {
      updateAction(propertyId, propertyData)
    }
  }

  React.useEffect(() => {
    if (addState?.success && !addIsPending) {
      toast({
        title: "Property Added!",
        description: addState.message,
      })
      router.push(`/properties/${addState.propertyId}/details`) // Redirect to the new property's details page
    } else if (addState?.error && !addIsPending) {
      toast({
        title: "Error Adding Property",
        description: addState.error,
        variant: "destructive",
      })
    }
  }, [addState, addIsPending, toast, router])

  React.useEffect(() => {
    if (updateState?.success && !updateIsPending) {
      toast({
        title: "Property Updated!",
        description: updateState.message,
      })
      // Optionally, refresh the page or redirect
    } else if (updateState?.error && !updateIsPending) {
      toast({
        title: "Error Updating Property",
        description: updateState.error,
        variant: "destructive",
      })
    }
  }, [updateState, updateIsPending, toast])

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{isNewProperty ? "Add New Property" : "Edit Property Details"}</CardTitle>
        <CardDescription>
          {isNewProperty ? "Enter the details for your new property." : `Editing details for ${initialData?.address}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
              required
              disabled={isPending}
            />
          </div>
          <div>
            <Label htmlFor="postcode">Postcode</Label>
            <Input
              id="postcode"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="SW1A 0AA"
              required
              disabled={isPending}
            />
          </div>
          <div>
            <Label htmlFor="rent">Monthly Rent (£)</Label>
            <Input
              id="rent"
              type="number"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              placeholder="1200.00"
              step="0.01"
              required
              disabled={isPending}
            />
          </div>
          <div>
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input
              id="bedrooms"
              type="number"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              placeholder="2"
              min="0"
              required
              disabled={isPending}
            />
          </div>
          <div>
            <Label htmlFor="bathrooms">Bathrooms</Label>
            <Input
              id="bathrooms"
              type="number"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              placeholder="1"
              min="0"
              required
              disabled={isPending}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of the property..."
              rows={4}
              disabled={isPending}
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : isNewProperty ? (
                "Add Property"
              ) : (
                "Update Property"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
