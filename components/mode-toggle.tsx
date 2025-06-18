"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

import { useTheme } from "next-themes"

export function ModeToggle() {
  const [mounted, setMounted] = useState(false)
  const { setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <button aria-label="Toggle Dark Mode" onClick={() => setTheme((theme) => (theme === "dark" ? "light" : "dark"))}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle dark mode</span>
    </button>
  )
}
