"use client"

import type React from "react"
import { useState, useActionState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2Icon, PlusCircleIcon } from "lucide-react"
import { reportIssue } from "@/lib/actions" // Assuming this is your server action
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { JobPriority, JobType } from "@prisma/client"

interface ReportIssueFormProps {
  properties: { id: string; address: string; postcode: string }[]
  userId: string
}

export function ReportIssueForm({ properties, userId }: ReportIssueFormProps) {
  const [propertyId, setPropertyId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [jobType, setJobType] = useState<JobType | "">("")
  const [priority, setPriority] = useState<JobPriority>(JobPriority.MEDIUM) // Default priority

  const { toast } = useToast()
  const router = useRouter()

  const [state, action, isPending] = useActionState(reportIssue, null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId || !title || !description || !jobType || !priority) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }
    action(userId, propertyId, title, description, jobType, priority)
  }

  useEffect(() => {
    if (state?.success && !isPending) {
      toast({
        title: "Issue Reported!",
        description: state.message,
      })
      setPropertyId("")
      setTitle("")
      setDescription("")
      setJobType("")
      setPriority(JobPriority.MEDIUM)
      router.push("/issues/reported-by-me") // Redirect to reported issues list
    } else if (state?.error && !isPending) {
      toast({
        title: "Error Reporting Issue",
        description: state.error,
        variant: "destructive",
      })
    }
  }, [state, isPending, toast, router])

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Report New Maintenance Issue</CardTitle>
        <CardDescription>Fill in the details below to report a new issue for a property.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="property">Select Property</Label>
            <Select onValueChange={setPropertyId} value={propertyId} disabled={isPending}>
              <SelectTrigger id="property">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((prop) => (
                  <SelectItem key={prop.id} value={prop.id}>
                    {prop.address}, {prop.postcode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="title">Issue Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leaky Faucet in Bathroom"
              required
              disabled={isPending}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="The faucet in the master bathroom has a constant drip. It started last night."
              rows={5}
              required
              disabled={isPending}
            />
          </div>
          <div>
            <Label htmlFor="jobType">Type of Job</Label>
            <Select onValueChange={(value: JobType) => setJobType(value)} value={jobType} disabled={isPending}>
              <SelectTrigger id="jobType">
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(JobType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select onValueChange={(value: JobPriority) => setPriority(value)} value={priority} disabled={isPending}>
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(JobPriority).map((prio) => (
                  <SelectItem key={prio} value={prio}>
                    {prio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Reporting...
              </>
            ) : (
              <>
                <PlusCircleIcon className="mr-2 h-4 w-4" /> Report Issue
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
