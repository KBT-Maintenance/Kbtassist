import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "KBT Assist",
  description: "Your comprehensive property management solution.",
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen flex-col">
            <header className="flex items-center justify-between p-4 border-b bg-background">
              <div className="flex items-center gap-2">
                {/* Simple text-based logo for KBT Assist */}
                <span className="text-2xl font-extrabold text-primary">KBT</span>
                <span className="text-2xl font-bold text-foreground">Assist</span>
                {/* You can replace this with an image logo later:
                <img src="/kbt-logo.svg" alt="KBT Assist Logo" className="h-8 w-auto" />
                */}
              </div>
              <ModeToggle />
            </header>
            <main className="flex-1">{children}</main>
            <footer className="flex items-center justify-center p-4 border-t bg-background text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} KBT Assist. All rights reserved.
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
