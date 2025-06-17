"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { Loader2Icon } from "lucide-react"

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { signIn, loading } = useAuth()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await signIn(email, password)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Login to KBT Assist</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  {"Logging In…"}
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {"Don’t have an account? "}
            <Link href="/sign-up" className="underline">
              Sign Up
            </Link>
          </div>

          <div className="mt-2 text-center text-xs text-muted-foreground">
            <p>Demo Accounts:</p>
            <p>Agent: agent@kbt.com / password</p>
            <p>Landlord: landlord@kbt.com / password</p>
            <p>Tenant: tenant@kbt.com / password</p>
            <p>Contractor: contractor@kbt.com / password</p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
