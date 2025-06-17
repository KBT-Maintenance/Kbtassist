"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircleIcon } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 py-12 dark:from-gray-900 dark:to-gray-800">
      <main className="container flex flex-col items-center justify-center px-4 text-center md:px-6">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-6xl md:text-7xl">
            KBT&nbsp;Assist: Your Ultimate Property&nbsp;Management Solution
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Streamline your property operations—manage tenants, contractors, and maintenance with ease.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild className="px-8 py-3 text-lg">
              <Link href="/sign-up">Start Your&nbsp;7-Day&nbsp;Free&nbsp;Trial</Link>
            </Button>
            <Button asChild variant="outline" className="px-8 py-3 text-lg">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>

        <section className="mt-16 w-full max-w-5xl">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-50">Why&nbsp;Choose&nbsp;KBT&nbsp;Assist?</h2>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
            Discover the features that make property management effortless.
          </p>

          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Intuitive Dashboard",
                desc: "Get a clear overview of all your properties and issues at a glance.",
                bullets: ["Real-time issue tracking", "Financial insights", "Tenant & contractor management"],
              },
              {
                title: "Seamless Communication",
                desc: "Integrated messaging for tenants, landlords, and contractors.",
                bullets: ["Direct messaging system", "Automated notifications", "Audit trails for all interactions"],
              },
              {
                title: "Automated Compliance",
                desc: "Stay on top of legal requirements with smart reminders.",
                bullets: ["Document management", "Expiry-date tracking", "Actionable compliance statuses"],
              },
            ].map((card) => (
              <Card
                key={card.title}
                className="flex flex-col items-center p-6 text-left shadow-lg transition-all hover:scale-105"
              >
                <CheckCircleIcon className="h-12 w-12 text-green-500" />
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-semibold">{card.title}</CardTitle>
                  <CardDescription>{card.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    {card.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 w-full max-w-3xl space-y-6">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-50">Ready&nbsp;to&nbsp;Get&nbsp;Started?</h2>
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Join&nbsp;KBT&nbsp;Assist today and experience the future of property management.
          </p>
          <Button asChild className="px-8 py-3 text-lg">
            <Link href="/sign-up">Sign&nbsp;Up&nbsp;for&nbsp;Free</Link>
          </Button>
        </section>
      </main>

      <footer className="mt-20 w-full bg-gray-100 py-8 text-center text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} KBT&nbsp;Assist. All rights reserved.</p>
      </footer>
    </div>
  )
}
