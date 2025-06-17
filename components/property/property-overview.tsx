import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BuildingIcon, DollarSignIcon, BedIcon, BathIcon, InfoIcon } from "lucide-react"

interface PropertyOverviewProps {
  property: {
    address: string
    postcode: string
    rent: number
    bedrooms: number
    bathrooms: number
    description?: string | null
    // Add other relevant property details here
  }
}

export function PropertyOverview({ property }: PropertyOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Overview</CardTitle>
        <CardDescription>Key details about {property.address}.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="flex items-center space-x-2">
          <BuildingIcon className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Address</p>
            <p>{property.address}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <InfoIcon className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Postcode</p>
            <p>{property.postcode}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSignIcon className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Monthly Rent</p>
            <p>£{property.rent.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <BedIcon className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Bedrooms</p>
            <p>{property.bedrooms}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <BathIcon className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Bathrooms</p>
            <p>{property.bathrooms}</p>
          </div>
        </div>
        {property.description && (
          <div className="md:col-span-2">
            <p className="text-sm font-medium">Description</p>
            <p className="text-muted-foreground">{property.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
