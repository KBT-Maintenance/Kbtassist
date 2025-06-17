"use client"

import type React from "react"
import { useState, useActionState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { JobStatus, UserRole, type Prisma, type JobComment, type User, type Contractor } from "@prisma/client"
import { format } from "date-fns"
import {
  updateMaintenanceJobStatus,
  addJobComment,
  assignContractorToJob,
  getContractorsForMarketplace,
  getJobComments,
} from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"
import { Loader2Icon, MessageSquareTextIcon, UserPlusIcon, CheckCircleIcon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define a more specific Job type based on your Prisma schema
type JobWithRelations = Prisma.JobGetPayload<{
  include: {
    property: true
    reporter: true
    assignedContractor: true
    comments: {
      include: {
        author: true
      }
    }
  }
}>

interface JobDetailsViewProps {
  job: JobWithRelations
  currentUserId: string
}

export function JobDetailsView({ job, currentUserId }: JobDetailsViewProps) {
  const { toast } = useToast()
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState<(JobComment & { author: Pick<User, "id" | "name" | "email"> })[]>(
    job.comments || [],
  )
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(job.assignedContractorId || null)
  const [availableContractors, setAvailableContractors] = useState<Contractor[]>([])

  const [statusUpdateState, statusUpdateAction, statusUpdateIsPending] = useActionState(
    updateMaintenanceJobStatus,
    null,
  )
  const [commentAddState, commentAddAction, commentAddIsPending] = useActionState(addJobComment, null)
  const [assignContractorState, assignContractorAction, assignContractorIsPending] = useActionState(
    assignContractorToJob,
    null,
  )

  const isPending = statusUpdateIsPending || commentAddIsPending || assignContractorIsPending

  const currentUserRole = (
    job.reporter?.id === currentUserId
      ? UserRole.TENANT
      : job.property?.landlordId === currentUserId
        ? UserRole.LANDLORD
        : job.assignedContractorId === currentUserId
          ? UserRole.CONTRACTOR
          : UserRole.AGENT
  ) as UserRole // Simplified role determination

  const getStatusBadgeVariant = (status: JobStatus) => {
    switch (status) {
      case JobStatus.REPORTED:
      case JobStatus.ACKNOWLEDGED:
        return "outline"
      case JobStatus.PENDING_QUOTE:
      case JobStatus.QUOTE_SUBMITTED:
      case JobStatus.AWAITING_APPROVAL:
        return "secondary"
      case JobStatus.IN_PROGRESS:
        return "default"
      case JobStatus.COMPLETED:
        return "success"
      case JobStatus.CANCELLED:
        return "destructive"
      default:
        return "secondary"
    }
  }

  const handleStatusChange = async (newStatus: JobStatus) => {
    statusUpdateAction(job.id, newStatus)
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) {
      toast({ title: "Empty Comment", description: "Comment cannot be empty.", variant: "destructive" })
      return
    }
    commentAddAction(job.id, currentUserId, newComment)
  }

  const handleAssignContractor = async () => {
    if (!selectedContractorId) {
      toast({
        title: "No Contractor Selected",
        description: "Please select a contractor to assign.",
        variant: "destructive",
      })
      return
    }
    assignContractorAction(job.id, selectedContractorId)
  }

  useEffect(() => {
    if (statusUpdateState?.success && !statusUpdateIsPending) {
      toast({ title: "Success", description: statusUpdateState.message })
      // Optionally, refresh job data or update local state
    } else if (statusUpdateState?.error && !statusUpdateIsPending) {
      toast({ title: "Error", description: statusUpdateState.error, variant: "destructive" })
    }
  }, [statusUpdateState, statusUpdateIsPending, toast])

  useEffect(() => {
    if (commentAddState?.success && !commentAddIsPending) {
      toast({ title: "Success", description: commentAddState.message })
      setNewComment("")
      // Re-fetch comments to get the latest list including the new one
      const fetchLatestComments = async () => {
        const { success, comments: latestComments, error } = await getJobComments(job.id)
        if (success && latestComments) {
          setComments(latestComments)
        } else if (error) {
          console.error("Failed to re-fetch comments:", error)
        }
      }
      fetchLatestComments()
    } else if (commentAddState?.error && !commentAddIsPending) {
      toast({ title: "Error", description: commentAddState.error, variant: "destructive" })
    }
  }, [commentAddState, commentAddIsPending, toast, job.id])

  useEffect(() => {
    if (assignContractorState?.success && !assignContractorIsPending) {
      toast({ title: "Success", description: assignContractorState.message })
      // Optionally, refresh job data or update local state
    } else if (assignContractorState?.error && !assignContractorIsPending) {
      toast({ title: "Error", description: assignContractorState.error, variant: "destructive" })
    }
  }, [assignContractorState, assignContractorIsPending, toast])

  // Fetch available contractors for assignment
  useEffect(() => {
    const fetchContractors = async () => {
      // Assuming only Agents/Property Managers can assign contractors
      if (currentUserRole === UserRole.AGENT || currentUserRole === UserRole.PROPERTY_MANAGER) {
        const { success, contractors, error } = await getContractorsForMarketplace(currentUserId, currentUserRole)
        if (success && contractors) {
          setAvailableContractors(contractors)
        } else if (error) {
          console.error("Failed to fetch contractors:", error)
        }
      }
    }
    fetchContractors()
  }, [currentUserId, currentUserRole])

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Job Details Card */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{job.title}</CardTitle>
          <CardDescription>
            Reported by {job.reporter?.name || job.reporter?.email} on{" "}
            {format(new Date(job.createdAt), "dd MMM yyyy 'at' HH:mm")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Description:</h3>
            <p>{job.description}</p>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Property:</h3>
              <p>
                {job.property?.address}, {job.property?.postcode}
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Status:</h3>
              <Badge variant={getStatusBadgeVariant(job.status)}>{job.status.replace(/_/g, " ")}</Badge>
            </div>
            <div>
              <h3 className="font-semibold">Priority:</h3>
              <Badge variant="outline">{job.priority}</Badge>
            </div>
            <div>
              <h3 className="font-semibold">Job Type:</h3>
              <Badge variant="outline">{job.jobType.replace(/_/g, " ")}</Badge>
            </div>
            {job.assignedContractor && (
              <div>
                <h3 className="font-semibold">Assigned Contractor:</h3>
                <p>{job.assignedContractor.name}</p>
                <p className="text-sm text-muted-foreground">{job.assignedContractor.email}</p>
              </div>
            )}
            {job.completedAt && (
              <div>
                <h3 className="font-semibold">Completed On:</h3>
                <p>{format(new Date(job.completedAt), "dd MMM yyyy 'at' HH:mm")}</p>
              </div>
            )}
          </div>
          <Separator />

          {/* Status Update Actions */}
          <div className="space-y-2">
            <h3 className="font-semibold">Update Status:</h3>
            <div className="flex flex-wrap gap-2">
              {[
                JobStatus.ACKNOWLEDGED,
                JobStatus.PENDING_QUOTE,
                JobStatus.QUOTE_SUBMITTED,
                JobStatus.AWAITING_APPROVAL,
                JobStatus.IN_PROGRESS,
                JobStatus.COMPLETED,
                JobStatus.CANCELLED,
              ].map((statusOption) => (
                <Button
                  key={statusOption}
                  variant={job.status === statusOption ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusChange(statusOption)}
                  disabled={isPending || job.status === statusOption}
                >
                  {isPending && statusUpdateIsPending ? (
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircleIcon className="mr-2 h-4 w-4" />
                  )}
                  {statusOption.replace(/_/g, " ")}
                </Button>
              ))}
            </div>
          </div>

          {/* Assign Contractor (for Agents/Property Managers) */}
          {(currentUserRole === UserRole.AGENT || currentUserRole === UserRole.PROPERTY_MANAGER) && (
            <div className="space-y-2">
              <h3 className="font-semibold">Assign Contractor:</h3>
              <div className="flex gap-2">
                <Select
                  onValueChange={setSelectedContractorId}
                  value={selectedContractorId || ""}
                  disabled={isPending || availableContractors.length === 0}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a contractor" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableContractors.length === 0 && (
                      <SelectItem value="no-contractors" disabled>
                        No contractors available
                      </SelectItem>
                    )}
                    {availableContractors.map((contractor) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        {contractor.name} ({contractor.specialties.join(", ")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssignContractor} disabled={isPending || !selectedContractorId}>
                  {assignContractorIsPending ? (
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlusIcon className="mr-2 h-4 w-4" />
                  )}
                  Assign
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Card */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Comments</CardTitle>
          <CardDescription>Communication log for this job.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-96 overflow-y-auto pr-2">
            {comments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="mb-4 p-3 bg-muted rounded-md">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                    <span className="font-semibold">{comment.author?.name || comment.author?.email || "Unknown"}</span>
                    <span>{format(new Date(comment.createdAt), "dd MMM yyyy HH:mm")}</span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleAddComment} className="flex gap-2 mt-4">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              disabled={isPending}
            />
            <Button type="submit" size="icon" disabled={isPending || !newComment.trim()}>
              {commentAddIsPending ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquareTextIcon className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
