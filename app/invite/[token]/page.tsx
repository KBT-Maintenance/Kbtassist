import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { checkInviteToken, acceptInvite } from "@/lib/actions"
import { redirect } from "next/navigation"
import { getServerSupabaseClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"

export default async function InvitePage({ params }: { params: { token: string } }) {
  const supabase = getServerSupabaseClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // If user is already logged in, redirect to dashboard
    redirect("/dashboard")
  }

  const { success, invite, error } = await checkInviteToken(params.token)

  if (!success || !invite) {
    console.error("Invalid or expired invite token:", error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-900">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Invalid Invitation</CardTitle>
            <CardDescription>The invitation link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Please contact the sender for a new invitation.</p>
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If invite is valid, show a page to accept it
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-900">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Accept Invitation</CardTitle>
          <CardDescription>You've been invited to join KBT Assist!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            You have been invited by **{invite.inviterEmail}** to join their team as a **{invite.role}**.
          </p>
          <form
            action={async () => {
              "use server"
              const { success: acceptSuccess, error: acceptError } = await acceptInvite(params.token)
              if (acceptSuccess) {
                redirect("/login?message=Invitation accepted. Please log in.")
              } else {
                console.error("Failed to accept invite:", acceptError)
                redirect(
                  `/invite/${params.token}?error=${encodeURIComponent(acceptError || "Failed to accept invite.")}`,
                )
              }
            }}
          >
            <Button type="submit" className="w-full">
              Accept Invitation
            </Button>
          </form>
          {/* Display error if redirect from form action includes it */}
          {/* This part would typically be handled by a client component or a more robust error display */}
        </CardContent>
      </Card>
    </div>
  )
}
