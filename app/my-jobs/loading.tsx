import { Loader2Icon } from "lucide-react"

export default function MyJobsLoading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Loader2Icon className="h-10 w-10 animate-spin text-primary" />
      <p className="ml-2 text-lg text-muted-foreground">Loading your jobs...</p>
    </div>
  )
}
