import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { SessionProvider } from "next-auth/react" // Import SessionProvider

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "KBT Assist",
  description: "Property Management Platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          {" "}
          {/* Wrap your app with SessionProvider */}
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <div className="flex min-h-screen flex-col">
              <header className="flex items-center justify-between p-4 border-b">
                <h1 className="text-xl font-bold">KBT Assist</h1>
                <ModeToggle />
              </header>
              <main className="flex-1">{children}</main>
            </div>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
