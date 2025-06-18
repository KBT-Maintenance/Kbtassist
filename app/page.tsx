import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getServerSession } from "next-auth"
import authOptions from "@/auth"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 text-center">
      <h2 className="text-4xl font-bold mb-4">Welcome to KBT Assist</h2>
      <p className="text-lg text-muted-foreground mb-8">Your comprehensive property management solution.</p>
      {session ? (
        <div className="space-y-4">
          <p className="text-xl">Hello, {session.user?.name || session.user?.email}!</p>
          <Link href="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
        </div>
      ) : (
        <div className="space-x-4">
          <Link href="/login">
            <Button size="lg">Login</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="lg" variant="outline">
              Sign Up
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
