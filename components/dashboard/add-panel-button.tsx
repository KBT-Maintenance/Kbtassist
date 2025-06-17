"use client"

import { Button } from "@/components/ui/button"
import { PlusCircleIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function AddPanelButton() {
  const { toast } = useToast()

  const handleClick = () => {
    toast({
      title: "Feature Coming Soon!",
      description: "Customizable dashboard panels are under development.",
    })
  }

  return (
    <div className="flex justify-center mt-6">
      <Button onClick={handleClick} variant="outline">
        <PlusCircleIcon className="mr-2 h-4 w-4" /> Add New Panel
      </Button>
    </div>
  )
}
