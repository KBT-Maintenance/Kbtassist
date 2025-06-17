"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { HomeIcon } from "lucide-react"

export default function WelcomePage() {
  const router = useRouter()
  const { user } = useAuth()

  const handleDismiss = () => {
    if (user) {
      router.push(`/${user.role}-dashboard`)
    } else {
      router.push("/login") // Fallback if user somehow not set
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-900">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-bold">Welcome to KBT Assist!</CardTitle>
          <CardDescription className="text-lg">Your ultimate partner in property management.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            We're thrilled to have you on board. KBT Assist simplifies property management, from maintenance tracking
            and tenant communication to compliance and financial oversight.
          </p>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">What's Next?</h3>
            <ul className="list-inside list-disc text-left text-muted-foreground mx-auto max-w-sm">
              <li>Explore your personalized dashboard.</li>
              <li>Add your first property or tenant.</li>
              <li>Check out the AI Co-pilot for insights.</li>
              <li>Familiarize yourself with compliance tools.</li>
            </ul>
          </div>
          <Button onClick={handleDismiss} className="w-full max-w-xs">
            <HomeIcon className="mr-2 h-4 w-4" /> Go to Dashboard
          </Button>
          <p className="text-sm text-muted-foreground">
            You can always access this information in the Help section of your sidebar.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
