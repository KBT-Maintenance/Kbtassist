"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon } from "lucide-react"

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/home")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
