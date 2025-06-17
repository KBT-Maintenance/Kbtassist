"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchIcon, FilterIcon, UserPlusIcon, Loader2Icon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { inviteContractorToMarketplace } from "@/lib/actions" // Assuming this is a server action
import { UserRole } from "@prisma/client"
import { useActionState } from "react-use-action-state"

interface ContractorMarketplaceProps {
  initialContractors: any[] // Replace 'any' with actual Contractor type
  userRole: UserRole
  currentUserId: string
}

export function ContractorMarketplace({ initialContractors, userRole, currentUserId }: ContractorMarketplaceProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSpecialty, setFilterSpecialty] = useState("all")
  const [filterLocation, setFilterLocation] = useState("all")
  const [filteredContractors, setFilteredContractors] = useState(initialContractors)
  const [inviteState, inviteAction, inviteIsPending] = useActionState(inviteContractorToMarketplace, null)

  const { toast } = useToast()

  // Extract unique specialties and locations for filters
  const allSpecialties = Array.from(new Set(initialContractors.flatMap((c) => c.specialties || []))).sort()
  const allLocations = Array.from(new Set(initialContractors.map((c) => c.location || ""))).sort()

  useEffect(() => {
    let currentContractors = initialContractors

    if (searchTerm) {
      currentContractors = currentContractors.filter(
        (contractor) =>
          contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contractor.specialties.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
          contractor.location.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterSpecialty !== "all") {
      currentContractors = currentContractors.filter((contractor) => contractor.specialties.includes(filterSpecialty))
    }

    if (filterLocation !== "all") {
      currentContractors = currentContractors.filter((contractor) => contractor.location === filterLocation)
    }

    setFilteredContractors(currentContractors)
  }, [searchTerm, filterSpecialty, filterLocation, initialContractors])

  useEffect(() => {
    if (inviteState?.success && !inviteIsPending) {
      toast({
        title: "Invitation Sent!",
        description: inviteState.message,
      })
      // Optionally, update the contractor's status in the list if needed
    } else if (inviteState?.error && !inviteIsPending) {
      toast({
        title: "Invitation Failed",
        description: inviteState.error,
        variant: "destructive",
      })
    }
  }, [inviteState, inviteIsPending, toast])

  const handleInviteContractor = (contractorId: string, contractorEmail: string) => {
    if (userRole === UserRole.CONTRACTOR) {
      toast({
        title: "Access Denied",
        description: "Contractors cannot invite other contractors.",
        variant: "destructive",
      })
      return
    }
    inviteAction(currentUserId, contractorId, contractorEmail)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Contractor Marketplace</CardTitle>
        <CardDescription>Browse and connect with contractors available on the KBT Assist network.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contractors by name, specialty, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select onValueChange={setFilterSpecialty} value={filterSpecialty}>
            <SelectTrigger className="w-full md:w-[180px]">
              <FilterIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by Specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {allSpecialties.map((specialty) => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setFilterLocation} value={filterLocation}>
            <SelectTrigger className="w-full md:w-[180px]">
              <FilterIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {allLocations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredContractors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No contractors found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredContractors.map((contractor) => (
              <Card key={contractor.id}>
                <CardHeader>
                  <CardTitle>{contractor.name}</CardTitle>
                  <CardDescription>{contractor.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Specialties:</strong> {contractor.specialties.join(", ")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Location:</strong> {contractor.location}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Phone:</strong> {contractor.phone}
                  </p>
                  {(userRole === UserRole.AGENT ||
                    userRole === UserRole.LANDLORD ||
                    userRole === UserRole.PROPERTY_MANAGER) && (
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleInviteContractor(contractor.id, contractor.email)}
                      disabled={inviteIsPending}
                    >
                      {inviteIsPending ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Inviting...
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="mr-2 h-4 w-4" /> Invite to Network
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
