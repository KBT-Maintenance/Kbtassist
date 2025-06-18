"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { UserRole, type IssueStatus, InvoiceStatus, type MessageVisibility } from "@prisma/client"
import { Resend } from "resend"
import { render } from "@react-email/render"
import { PaymentReminderEmail } from "@/emails/payment-reminder"
import { getServerSession } from "next-auth/next"
import authOptions from "@/auth"
import { prisma } from "./db"
import { z } from "zod"
import { put, del } from "@vercel/blob" // Import Vercel Blob functions

const resend = new Resend(process.env.RESEND_API_KEY)

// Helper to get Supabase client for server actions
function getSupabaseClient() {
  return createClient(cookies())
}

// User Management Actions
export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as UserRole

  const supabase = getSupabaseClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role },
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, message: "Sign up successful! Please check your email for a confirmation link." }
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const supabase = getSupabaseClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, message: "Signed in successfully!" }
}

export async function signOut() {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, message: "Signed out successfully!" }
}

const InviteFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  role: z.nativeEnum(UserRole),
  name: z.string().min(1, { message: "Name is required." }),
})

export async function inviteTeamMember(prevState: any, formData: FormData) {
  const validatedFields = InviteFormSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    name: formData.get("name"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Invite Team Member.",
    }
  }

  const { email, role, name } = validatedFields.data

  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return {
      errors: { email: ["Not authorized"] },
      message: "Not authorized. Failed to Invite Team Member.",
    }
  }

  const inviterUserId = session?.user.id

  const supabase = getSupabaseClient()

  try {
    const { data: existingUsers, error: existingUserError } = await supabase.auth.admin.listUsers({
      email,
    })

    if (existingUserError) {
      throw new Error(existingUserError.message)
    }

    if (existingUsers.users.length > 0) {
      return { success: false, error: "User with this email already exists." }
    }

    const { data: invite, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { role, name },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/invite`,
    })

    if (inviteError) {
      console.error("Supabase invite error:", inviteError)
      return { success: false, error: inviteError.message }
    }

    const emailHtml = render(
      <PaymentReminderEmail
        username={name}
        invoiceAmount="N/A" // Not applicable for invite
        invoiceDueDate="N/A" // Not applicable for invite
        inviteLink={`${process.env.NEXT_PUBLIC_APP_URL}/invite`} // Simplified link, Supabase handles the token internally via redirectTo
      />,
    )

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "You are invited to join KBT Assist!",
      html: emailHtml,
    })

    return { success: true, message: `Invitation sent to ${email}!` }
  } catch (error: any) {
    console.error("Error inviting team member:", error)
    return { success: false, error: error.message || "Failed to send invitation." }
  }
}

export async function updateTeamMemberRole(prevState: any, formData: FormData) {
  const userId = formData.get("userId") as string
  const newRole = formData.get("newRole") as UserRole

  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role: newRole },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    })

    return { success: true, message: "Team member role updated successfully!" }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update role." }
  }
}

// New: Add Team Member (alias for inviteTeamMember or distinct if needed)
export async function addTeamMember(prevState: any, formData: FormData) {
  return inviteTeamMember(prevState, formData)
}

// New: Get Team Members
export async function getTeamMembers() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const teamMembers = await prisma.user.findMany({
      where: {
        // Assuming team members are part of the same organization or invited by the current user's organization
        // This logic might need refinement based on your specific organization model
        id: { not: session.user.id }, // Exclude current user
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })
    return { success: true, data: teamMembers }
  } catch (error: any) {
    console.error("Error fetching team members:", error)
    return { success: false, error: error.message || "Failed to fetch team members." }
  }
}

// New: Get Team Member Details
export async function getTeamMemberDetails(memberId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const member = await prisma.user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })
    if (!member) {
      return { success: false, error: "Team member not found." }
    }
    return { success: true, data: member }
  } catch (error: any) {
    console.error("Error fetching team member details:", error)
    return { success: false, error: error.message || "Failed to fetch team member details." }
  }
}

// New: Get User Details
export async function getUserDetails(userId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })
    if (!user) {
      return { success: false, error: "User not found." }
    }
    return { success: true, data: user }
  } catch (error: any) {
    console.error("Error fetching user details:", error)
    return { success: false, error: error.message || "Failed to fetch user details." }
  }
}

// Property Management Actions
export async function addProperty(prevState: any, formData: FormData) {
  const name = formData.get("name") as string
  const address = formData.get("address") as string
  const landlordId = formData.get("landlordId") as string // Assuming landlordId is passed

  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "User not authenticated." }
  }

  try {
    const newProperty = await prisma.property.create({
      data: {
        name,
        address,
        landlordId,
        addedById: session.user.id, // Link to the user who added it
      },
    })
    return { success: true, message: `Property "${newProperty.name}" added successfully!` }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add property." }
  }
}

export async function updatePropertyDetails(prevState: any, formData: FormData) {
  const propertyId = formData.get("propertyId") as string
  const name = formData.get("name") as string
  const address = formData.get("address") as string

  try {
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: { name, address },
    })
    return { success: true, message: `Property "${updatedProperty.name}" updated successfully!` }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update property." }
  }
}

// New: Update Property (alias for updatePropertyDetails or distinct if needed)
export async function updateProperty(prevState: any, formData: FormData) {
  return updatePropertyDetails(prevState, formData)
}

// New: Get Properties for User
export async function getPropertiesForUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { addedById: session.user.id },
          { tenants: { some: { id: session.user.id } } },
          // Add other conditions if properties can be associated with users in other ways (e.g., property manager)
        ],
      },
      include: {
        tenants: { select: { id: true, name: true } },
        landlord: { select: { id: true, name: true } },
      },
    })
    return { success: true, data: properties }
  } catch (error: any) {
    console.error("Error fetching properties for user:", error)
    return { success: false, error: error.message || "Failed to fetch properties." }
  }
}

// New: Get Property Details
export async function getPropertyDetails(propertyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        tenants: { select: { id: true, name: true, email: true } },
        landlord: { select: { id: true, name: true, email: true } },
        maintenanceJobs: true,
        documents: true,
        invoices: true,
        notices: true,
        rentPayments: true,
      },
    })
    if (!property) {
      return { success: false, error: "Property not found." }
    }
    // Basic authorization check: ensure user is related to this property
    const isAuthorized =
      property.addedById === session.user.id ||
      property.tenants.some((tenant) => tenant.id === session.user.id) ||
      property.landlordId === session.user.id // Assuming landlordId is user ID
    if (!isAuthorized) {
      return { success: false, error: "Not authorized to view this property." }
    }
    return { success: true, data: property }
  } catch (error: any) {
    console.error("Error fetching property details:", error)
    return { success: false, error: error.message || "Failed to fetch property details." }
  }
}

// New: Get Property Maintenance Jobs
export async function getPropertyMaintenanceJobs(propertyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const jobs = await prisma.maintenanceJob.findMany({
      where: { propertyId },
      include: {
        property: { select: { name: true, address: true } },
        reportedBy: { select: { name: true, email: true } },
        assignedTo: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, data: jobs }
  } catch (error: any) {
    console.error("Error fetching property maintenance jobs:", error)
    return { success: false, error: error.message || "Failed to fetch property maintenance jobs." }
  }
}

// New: Get Property Tenants
export async function getPropertyTenants(propertyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        tenants: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    })
    if (!property) {
      return { success: false, error: "Property not found." }
    }
    return { success: true, data: property.tenants }
  } catch (error: any) {
    console.error("Error fetching property tenants:", error)
    return { success: false, error: error.message || "Failed to fetch property tenants." }
  }
}

// New: Get Property Rent Payments
export async function getPropertyRentPayments(propertyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const rentPayments = await prisma.rentPayment.findMany({
      where: { propertyId },
      include: {
        tenant: { select: { name: true, email: true } },
        invoice: { select: { amount: true, dueDate: true, status: true } },
      },
      orderBy: { paymentDate: "desc" },
    })
    return { success: true, data: rentPayments }
  } catch (error: any) {
    console.error("Error fetching property rent payments:", error)
    return { success: false, error: error.message || "Failed to fetch property rent payments." }
  }
}

// New: Get Property Legal Notices
export async function getPropertyLegalNotices(propertyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const notices = await prisma.notice.findMany({
      where: { propertyId },
      include: {
        issuedBy: { select: { name: true, email: true } },
        issuedTo: { select: { name: true, email: true } },
      },
      orderBy: { issuedDate: "desc" },
    })
    return { success: true, data: notices }
  } catch (error: any) {
    console.error("Error fetching property legal notices:", error)
    return { success: false, error: error.message || "Failed to fetch property legal notices." }
  }
}

// Tenant Management Actions
// Note: addTenantToProperty is now handled by lib/actions/tenant.ts addTenant
// export async function addTenantToProperty(prevState: any, formData: FormData) { ... }

// New: Get All Tenants for User (e.g., for a landlord/property manager)
export async function getAllTenantsForUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const tenants = await prisma.user.findMany({
      where: {
        role: UserRole.TENANT,
        // Assuming tenants are linked to properties managed by the current user
        properties: {
          some: {
            OR: [{ addedById: session.user.id }, { landlordId: session.user.id }],
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        properties: { select: { id: true, name: true, address: true } },
      },
    })
    return { success: true, data: tenants }
  } catch (error: any) {
    console.error("Error fetching all tenants for user:", error)
    return { success: false, error: error.message || "Failed to fetch tenants." }
  }
}

// New: Get Tenant Rent Payments
export async function getTenantRentPayments(tenantId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  // Ensure the requesting user is the tenant themselves or authorized to view
  if (session.user.id !== tenantId && session.user.role === UserRole.TENANT) {
    return { success: false, error: "Not authorized to view other tenant's payments." }
  }
  try {
    const rentPayments = await prisma.rentPayment.findMany({
      where: { tenantId },
      include: {
        property: { select: { name: true, address: true } },
        invoice: { select: { amount: true, dueDate: true, status: true } },
      },
      orderBy: { paymentDate: "desc" },
    })
    return { success: true, data: rentPayments }
  } catch (error: any) {
    console.error("Error fetching tenant rent payments:", error)
    return { success: false, error: error.message || "Failed to fetch tenant rent payments." }
  }
}

// New: Get Tenant Shared Documents
export async function getTenantSharedDocuments(tenantId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  // Ensure the requesting user is the tenant themselves or authorized to view
  if (session.user.id !== tenantId && session.user.role === UserRole.TENANT) {
    return { success: false, error: "Not authorized to view other tenant's documents." }
  }
  try {
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { uploadedById: tenantId }, // Documents uploaded by the tenant
          { property: { tenants: { some: { id: tenantId } } } }, // Documents related to tenant's property
          // Add other conditions for shared documents if applicable
        ],
      },
      include: {
        property: { select: { name: true, address: true } },
        uploadedBy: { select: { name: true, email: true } },
      },
      orderBy: { uploadedAt: "desc" },
    })
    return { success: true, data: documents }
  } catch (error: any) {
    console.error("Error fetching tenant shared documents:", error)
    return { success: false, error: error.message || "Failed to fetch tenant shared documents." }
  }
}

// Maintenance Job Actions
export async function createMaintenanceJob(prevState: any, formData: FormData) {
  const propertyId = formData.get("propertyId") as string
  const reportedById = formData.get("reportedById") as string
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const priority = formData.get("priority") as string
  const status = formData.get("status") as IssueStatus // Use IssueStatus enum

  try {
    const newJob = await prisma.maintenanceJob.create({
      data: {
        propertyId,
        reportedById,
        title,
        description,
        priority,
        status,
      },
    })
    return { success: true, message: `Maintenance job "${newJob.title}" created successfully!` }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create maintenance job." }
  }
}

export async function updateMaintenanceJobStatus(prevState: any, formData: FormData) {
  const jobId = formData.get("jobId") as string
  const newStatus = formData.get("newStatus") as IssueStatus

  try {
    const updatedJob = await prisma.maintenanceJob.update({
      where: { id: jobId },
      data: { status: newStatus },
    })
    return { success: true, message: `Job status updated to ${updatedJob.status}!` }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update job status." }
  }
}

// New: Report Issue (alias for createMaintenanceJob or distinct if needed)
export async function reportIssue(prevState: any, formData: FormData) {
  return createMaintenanceJob(prevState, formData)
}

// New: Get Maintenance Jobs for User
export async function getMaintenanceJobsForUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const jobs = await prisma.maintenanceJob.findMany({
      where: {
        OR: [
          { reportedById: session.user.id },
          { assignedToId: session.user.id },
          { property: { addedById: session.user.id } }, // Jobs for properties managed by user
          { property: { tenants: { some: { id: session.user.id } } } },
        ],
      },
      include: {
        property: { select: { name: true, address: true } },
        reportedBy: { select: { name: true, email: true } },
        assignedTo: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, data: jobs }
  } catch (error: any) {
    console.error("Error fetching maintenance jobs for user:", error)
    return { success: false, error: error.message || "Failed to fetch maintenance jobs." }
  }
}

// New: Get Maintenance Job Details
export async function getMaintenanceJobDetails(jobId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const job = await prisma.maintenanceJob.findUnique({
      where: { id: jobId },
      include: {
        property: { select: { id: true, name: true, address: true } },
        reportedBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    })
    if (!job) {
      return { success: false, error: "Maintenance job not found." }
    }
    // Basic authorization check: ensure user is related to this job
    const isAuthorized =
      job.reportedById === session.user.id ||
      job.assignedToId === session.user.id ||
      job.property.addedById === session.user.id ||
      job.property.tenants.some((tenant) => tenant.id === session.user.id)
    if (!isAuthorized) {
      return { success: false, error: "Not authorized to view this job." }
    }
    return { success: true, data: job }
  } catch (error: any) {
    console.error("Error fetching maintenance job details:", error)
    return { success: false, error: error.message || "Failed to fetch maintenance job details." }
  }
}

// New: Add Job Comment
export async function addJobComment(prevState: any, formData: FormData) {
  const jobId = formData.get("jobId") as string
  const authorId = formData.get("authorId") as string
  const content = formData.get("content") as string

  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.id !== authorId) {
    return { success: false, error: "Not authorized to add comment." }
  }

  try {
    const newComment = await prisma.jobComment.create({
      data: {
        maintenanceJobId: jobId,
        authorId,
        content,
      },
    })
    return { success: true, message: "Comment added successfully!", data: newComment }
  } catch (error: any) {
    console.error("Error adding job comment:", error)
    return { success: false, error: error.message || "Failed to add comment." }
  }
}

// New: Get Job Comments
export async function getJobComments(jobId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const comments = await prisma.jobComment.findMany({
      where: { maintenanceJobId: jobId },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    })
    return { success: true, data: comments }
  } catch (error: any) {
    console.error("Error fetching job comments:", error)
    return { success: false, error: error.message || "Failed to fetch job comments." }
  }
}

// New: Assign Contractor to Job
export async function assignContractorToJob(prevState: any, formData: FormData) {
  const jobId = formData.get("jobId") as string
  const contractorId = formData.get("contractorId") as string

  const session = await getServerSession(authOptions)
  if (
    !session?.user ||
    ![UserRole.AGENT, UserRole.LANDLORD, UserRole.PROPERTY_MANAGER].includes(session.user.role as UserRole)
  ) {
    return { success: false, error: "Not authorized to assign contractors." }
  }

  try {
    const updatedJob = await prisma.maintenanceJob.update({
      where: { id: jobId },
      data: { assignedToId: contractorId, status: "ASSIGNED" as IssueStatus },
    })
    return { success: true, message: `Job assigned to contractor successfully!`, data: updatedJob }
  } catch (error: any) {
    console.error("Error assigning contractor to job:", error)
    return { success: false, error: error.message || "Failed to assign contractor." }
  }
}

// New: Get Contractor Jobs
export async function getContractorJobs(contractorId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  // Ensure the requesting user is the contractor themselves or authorized to view
  if (
    session.user.id !== contractorId &&
    session.user.role !== UserRole.AGENT &&
    session.user.role !== UserRole.PROPERTY_MANAGER
  ) {
    return { success: false, error: "Not authorized to view other contractor's jobs." }
  }
  try {
    const jobs = await prisma.maintenanceJob.findMany({
      where: { assignedToId: contractorId },
      include: {
        property: { select: { name: true, address: true } },
        reportedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, data: jobs }
  } catch (error: any) {
    console.error("Error fetching contractor jobs:", error)
    return { success: false, error: error.message || "Failed to fetch contractor jobs." }
  }
}

// Contractor Actions
export async function inviteContractorToMarketplace(
  prevState: { success: boolean; message?: string; error?: string } | null,
  payload: { inviterUserId: string; contractorId: string; contractorEmail: string },
) {
  const { inviterUserId, contractorId, contractorEmail } = payload
  const supabase = getSupabaseClient()

  try {
    const { data: inviterData, error: inviterError } = await supabase
      .from("users")
      .select("role")
      .eq("id", inviterUserId)
      .single()

    if (
      inviterError ||
      !inviterData ||
      ![UserRole.AGENT, UserRole.LANDLORD, UserRole.PROPERTY_MANAGER].includes(inviterData.role as UserRole)
    ) {
      return {
        success: false,
        error: "Unauthorized: Only agents, landlords, or property managers can invite contractors.",
      }
    }

    const existingInvitation = await prisma.contractorInvitation.findFirst({
      where: {
        contractorId: contractorId,
        status: {
          in: ["PENDING", "ACCEPTED"],
        },
      },
    })

    if (existingInvitation) {
      return { success: false, error: "Contractor already invited or part of your network." }
    }

    await prisma.contractorInvitation.create({
      data: {
        inviterId: inviterUserId,
        contractorId: contractorId,
        status: "PENDING",
      },
    })

    console.log(`Invitation sent to ${contractorEmail} by ${inviterUserId}`)

    return { success: true, message: `Invitation sent to ${contractorEmail}!` }
  } catch (error: any) {
    console.error("Error inviting contractor:", error)
    return { success: false, error: error.message || "Failed to send invitation." }
  }
}

// New: Add Contractor
export async function addContractor(prevState: any, formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const specialty = formData.get("specialty") as string

  const session = await getServerSession(authOptions)
  if (
    !session?.user ||
    ![UserRole.AGENT, UserRole.LANDLORD, UserRole.PROPERTY_MANAGER].includes(session.user.role as UserRole)
  ) {
    return { success: false, error: "Not authorized to add contractors." }
  }

  try {
    // Check if user exists in auth.users
    const supabase = getSupabaseClient()
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({ email })

    if (authError) {
      throw new Error(authError.message)
    }

    let userId: string
    if (authUsers.users.length === 0) {
      // If user doesn't exist, invite them
      const { data: invite, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { role: UserRole.CONTRACTOR, name },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/invite`,
      })
      if (inviteError) {
        throw new Error(inviteError.message)
      }
      userId = invite.user!.id
    } else {
      userId = authUsers.users[0].id // Use the ID of the existing user
    }

    // Create or update user in public.users table
    await prisma.user.upsert({
      where: { id: userId },
      update: { name, email, role: UserRole.CONTRACTOR },
      create: { id: userId, name, email, role: UserRole.CONTRACTOR },
    })

    const newContractor = await prisma.contractor.create({
      data: {
        userId: userId,
        name,
        email,
        phone,
        specialty,
        addedById: session.user.id,
      },
    })
    return { success: true, message: `Contractor "${newContractor.name}" added successfully!` }
  } catch (error: any) {
    console.error("Error adding contractor:", error)
    return { success: false, error: error.message || "Failed to add contractor." }
  }
}

// New: Get Contractors for Marketplace
export async function getContractorsForMarketplace() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const contractors = await prisma.contractor.findMany({
      include: {
        user: { select: { id: true, email: true } },
      },
      // You might want to filter by availability, ratings, etc.
    })
    return { success: true, data: contractors }
  } catch (error: any) {
    console.error("Error fetching contractors for marketplace:", error)
    return { success: false, error: error.message || "Failed to fetch contractors." }
  }
}

// Document Management Actions
export async function uploadDocument(prevState: any, formData: FormData) {
  const propertyId = formData.get("propertyId") as string
  const documentType = formData.get("documentType") as string
  const file = formData.get("file") as File

  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "User not authenticated." }
  }

  try {
    const filename = `${session.user.id}/${propertyId}/${file.name}`
    const blob = await put(filename, file, {
      access: "public",
    })

    await prisma.document.create({
      data: {
        propertyId,
        uploadedById: session.user.id,
        documentType,
        fileName: file.name,
        fileUrl: blob.url, // Use Vercel Blob URL
      },
    })

    return { success: true, message: "Document uploaded successfully!" }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to upload document." }
  }
}

// New: Get Shared Documents for User
export async function getSharedDocumentsForUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { uploadedById: session.user.id },
          { property: { tenants: { some: { id: session.user.id } } } }, // Documents related to properties where user is a tenant
          { property: { addedById: session.user.id } }, // Documents related to properties added by user
          { property: { landlordId: session.user.id } }, // Documents related to properties owned by user (landlord)
        ],
      },
      include: {
        property: { select: { name: true, address: true } },
        uploadedBy: { select: { name: true, email: true } },
      },
      orderBy: { uploadedAt: "desc" },
    })
    return { success: true, data: documents }
  } catch (error: any) {
    console.error("Error fetching shared documents for user:", error)
    return { success: false, error: error.message || "Failed to fetch shared documents." }
  }
}

// New: Add Compliance Document
export async function addComplianceDocument(prevState: any, formData: FormData) {
  const propertyId = formData.get("propertyId") as string
  const documentType = formData.get("documentType") as string
  const file = formData.get("file") as File

  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "User not authenticated." }
  }

  try {
    const filename = `compliance/${propertyId}/${file.name}`
    const blob = await put(filename, file, {
      access: "public",
    })

    await prisma.complianceDocument.create({
      data: {
        propertyId,
        uploadedById: session.user.id,
        documentType,
        fileName: file.name,
        fileUrl: blob.url, // Use Vercel Blob URL
      },
    })

    return { success: true, message: "Compliance document uploaded successfully!" }
  } catch (error: any) {
    console.error("Error uploading compliance document:", error)
    return { success: false, error: error.message || "Failed to upload compliance document." }
  }
}

// New: Get Compliance Documents
export async function getComplianceDocuments(propertyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const documents = await prisma.complianceDocument.findMany({
      where: { propertyId },
      include: {
        uploadedBy: { select: { name: true, email: true } },
      },
      orderBy: { uploadedAt: "desc" },
    })
    return { success: true, data: documents }
  } catch (error: any) {
    console.error("Error fetching compliance documents:", error)
    return { success: false, error: error.message || "Failed to fetch compliance documents." }
  }
}

// New: Update Compliance Document
export async function updateComplianceDocument(prevState: any, formData: FormData) {
  const documentId = formData.get("documentId") as string
  const documentType = formData.get("documentType") as string
  const fileName = formData.get("fileName") as string // Assuming filename can be updated

  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }

  try {
    const updatedDocument = await prisma.complianceDocument.update({
      where: { id: documentId },
      data: { documentType, fileName },
    })
    return { success: true, message: "Compliance document updated successfully!", data: updatedDocument }
  } catch (error: any) {
    console.error("Error updating compliance document:", error)
    return { success: false, error: error.message || "Failed to update compliance document." }
  }
}

// New: Delete Compliance Document
export async function deleteComplianceDocument(documentId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const document = await prisma.complianceDocument.findUnique({ where: { id: documentId } })
    if (document) {
      // Delete from Vercel Blob Storage
      await del(document.fileUrl)
    }

    await prisma.complianceDocument.delete({
      where: { id: documentId },
    })
    return { success: true, message: "Compliance document deleted successfully!" }
  } catch (error: any) {
    console.error("Error deleting compliance document:", error)
    return { success: false, error: error.message || "Failed to delete compliance document." }
  }
}

// New: Generate Inventory Analysis (Placeholder for AI integration)
export async function generateInventoryAnalysis(propertyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    // In a real application, this would call an AI model (e.g., via Fal, DeepInfra)
    // to analyze inventory data and generate insights.
    // For now, it's a placeholder.
    console.log(`Generating inventory analysis for property ${propertyId}...`)
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate AI processing time

    const analysisResult = {
      propertyId,
      insights:
        "Based on current inventory, consider restocking common repair items like light bulbs and filters. High usage of certain tools suggests potential for bulk purchase discounts.",
      recommendations: [
        "Restock filters (HVAC, water)",
        "Bulk purchase common tools",
        "Review seasonal inventory needs",
      ],
      generatedAt: new Date().toISOString(),
    }

    // You might save this analysis to a database or return it directly
    return { success: true, data: analysisResult, message: "Inventory analysis generated." }
  } catch (error: any) {
    console.error("Error generating inventory analysis:", error)
    return { success: false, error: error.message || "Failed to generate inventory analysis." }
  }
}

// New: Add Inventory Item
export async function addInventoryItem(prevState: any, formData: FormData) {
  const propertyId = formData.get("propertyId") as string
  const name = formData.get("name") as string
  const quantity = Number.parseInt(formData.get("quantity") as string)
  const unit = formData.get("unit") as string
  const location = formData.get("location") as string

  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }

  try {
    const newItem = await prisma.inventoryItem.create({
      data: {
        propertyId,
        name,
        quantity,
        unit,
        location,
        addedById: session.user.id,
      },
    })
    return { success: true, message: `Inventory item "${newItem.name}" added successfully!`, data: newItem }
  } catch (error: any) {
    console.error("Error adding inventory item:", error)
    return { success: false, error: error.message || "Failed to add inventory item." }
  }
}

// New: Get Inventory Items
export async function getInventoryItems(propertyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const items = await prisma.inventoryItem.findMany({
      where: { propertyId },
      include: {
        addedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, data: items }
  } catch (error: any) {
    console.error("Error fetching inventory items:", error)
    return { success: false, error: error.message || "Failed to fetch inventory items." }
  }
}

// New: Update Inventory Item
export async function updateInventoryItem(prevState: any, formData: FormData) {
  const itemId = formData.get("itemId") as string
  const name = formData.get("name") as string
  const quantity = Number.parseInt(formData.get("quantity") as string)
  const unit = formData.get("unit") as string
  const location = formData.get("location") as string

  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }

  try {
    const updatedItem = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: { name, quantity, unit, location },
    })
    return { success: true, message: "Inventory item updated successfully!", data: updatedItem }
  } catch (error: any) {
    console.error("Error updating inventory item:", error)
    return { success: false, error: error.message || "Failed to update inventory item." }
  }
}

// New: Delete Inventory Item
export async function deleteInventoryItem(itemId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    await prisma.inventoryItem.delete({
      where: { id: itemId },
    })
    return { success: true, message: "Inventory item deleted successfully!" }
  } catch (error: any) {
    console.error("Error deleting inventory item:", error)
    return { success: false, error: error.message || "Failed to delete inventory item." }
  }
}

// Messaging Actions
export async function sendMessage(
  prevState: { success: boolean; message?: string; error?: string } | null,
  payload: { senderId: string; recipientId: string; content: string; visibility: MessageVisibility },
) {
  const { senderId, recipientId, content, visibility } = payload
  const supabase = getSupabaseClient()

  try {
    const { data: message, error: messageError } = await supabase.from("messages").insert({
      sender_id: senderId,
      recipient_id: recipientId,
      content,
      visibility,
      is_read: false,
    })

    if (messageError) {
      throw new Error(messageError.message)
    }

    return { success: true, message: "Message sent successfully!" }
  } catch (error: any) {
    console.error("Error sending message:", error)
    return { success: false, error: error.message || "Failed to send message." }
  }
}

// Invoice Actions
const InvoiceSchema = z.object({
  propertyId: z.string().min(1, { message: "Property ID is required." }),
  tenantId: z.string().min(1, { message: "Tenant ID is required." }),
  amount: z.coerce.number().gt(0, { message: "Please enter an amount greater than $0." }),
  dueDate: z.string().min(1, { message: "Due date is required." }),
  description: z.string().optional(),
})

export type State = {
  errors?: {
    propertyId?: string[]
    tenantId?: string[]
    amount?: string[]
    dueDate?: string[]
    description?: string[]
  }
  message?: string | null
}

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = InvoiceSchema.safeParse({
    propertyId: formData.get("propertyId"),
    tenantId: formData.get("tenantId"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
    description: formData.get("description"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    }
  }

  const { propertyId, tenantId, amount, dueDate, description } = validatedFields.data

  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return {
      errors: { tenantId: ["Not authorized"] },
      message: "Not authorized. Failed to Create Invoice.",
    }
  }

  try {
    const newInvoice = await prisma.invoice.create({
      data: {
        propertyId,
        tenantId,
        amount,
        dueDate: new Date(dueDate),
        status: InvoiceStatus.PENDING,
        description,
      },
    })

    const tenant = await prisma.user.findUnique({
      where: { id: tenantId },
      select: { name: true, email: true },
    })

    if (!tenant) {
      return { success: false, error: "Tenant not found for invoice email." }
    }

    const invoiceLink = `${process.env.NEXT_PUBLIC_APP_URL}/payments/invoices/${newInvoice.id}`

    const emailHtml = render(
      <PaymentReminderEmail
        username={tenant.name || tenant.email}
        invoiceAmount={amount.toFixed(2)}
        invoiceDueDate={new Date(dueDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
        invoiceLink={invoiceLink}
      />,
    )

    await resend.emails.send({
      from: "invoices@resend.dev",
      to: tenant.email,
      subject: "Payment Reminder: Your Invoice is Due!",
      html: emailHtml,
    })

    return { success: true, message: `Invoice for ${amount} created successfully!` }
  } catch (error: any) {
    console.error("Error creating invoice:", error)
    return { success: false, error: error.message || "Failed to create invoice." }
  }
}

export async function updateInvoiceStatus(prevState: any, formData: FormData) {
  const invoiceId = formData.get("invoiceId") as string
  const newStatus = formData.get("newStatus") as InvoiceStatus

  try {
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus },
    })
    return { success: true, message: `Invoice status updated to ${updatedInvoice.status}!` }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update invoice status." }
  }
}

// New: Get All Rent Payments for User
export async function getAllRentPaymentsForUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const rentPayments = await prisma.rentPayment.findMany({
      where: {
        OR: [
          { tenantId: session.user.id }, // Payments made by the user (if tenant)
          { property: { addedById: session.user.id } }, // Payments for properties managed by user
          { property: { landlordId: session.user.id } }, // Payments for properties owned by user (landlord)
        ],
      },
      include: {
        tenant: { select: { name: true, email: true } },
        property: { select: { name: true, address: true } },
        invoice: { select: { amount: true, dueDate: true, status: true } },
      },
      orderBy: { paymentDate: "desc" },
    })
    return { success: true, data: rentPayments }
  } catch (error: any) {
    console.error("Error fetching all rent payments for user:", error)
    return { success: false, error: error.message || "Failed to fetch rent payments." }
  }
}

// New: Add Rent Payment
export async function addRentPayment(prevState: any, formData: FormData) {
  const invoiceId = formData.get("invoiceId") as string
  const tenantId = formData.get("tenantId") as string
  const amount = Number.parseFloat(formData.get("amount") as string)
  const paymentDate = formData.get("paymentDate") as string
  const paymentMethod = formData.get("paymentMethod") as string

  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }

  try {
    const newPayment = await prisma.rentPayment.create({
      data: {
        invoiceId,
        tenantId,
        amount,
        paymentDate: new Date(paymentDate),
        paymentMethod,
      },
    })

    // Optionally update invoice status to PAID
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.PAID },
    })

    return { success: true, message: "Rent payment recorded successfully!", data: newPayment }
  } catch (error: any) {
    console.error("Error adding rent payment:", error)
    return { success: false, error: error.message || "Failed to add rent payment." }
  }
}

// New: Update Rent Payment
export async function updateRentPayment(prevState: any, formData: FormData) {
  const paymentId = formData.get("paymentId") as string
  const amount = Number.parseFloat(formData.get("amount") as string)
  const paymentDate = formData.get("paymentDate") as string
  const paymentMethod = formData.get("paymentMethod") as string

  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }

  try {
    const updatedPayment = await prisma.rentPayment.update({
      where: { id: paymentId },
      data: { amount, paymentDate: new Date(paymentDate), paymentMethod },
    })
    return { success: true, message: "Rent payment updated successfully!", data: updatedPayment }
  } catch (error: any) {
    console.error("Error updating rent payment:", error)
    return { success: false, error: error.message || "Failed to update rent payment." }
  }
}

// New: Delete Rent Payment
export async function deleteRentPayment(paymentId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    await prisma.rentPayment.delete({
      where: { id: paymentId },
    })
    return { success: true, message: "Rent payment deleted successfully!" }
  } catch (error: any) {
    console.error("Error deleting rent payment:", error)
    return { success: false, error: error.message || "Failed to delete rent payment." }
  }
}

// New: Get Notices for User
export async function getNoticesForUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const notices = await prisma.notice.findMany({
      where: {
        OR: [
          { issuedById: session.user.id },
          { issuedToId: session.user.id },
          { property: { addedById: session.user.id } },
          { property: { tenants: { some: { id: session.user.id } } } },
        ],
      },
      include: {
        property: { select: { name: true, address: true } },
        issuedBy: { select: { name: true, email: true } },
        issuedTo: { select: { name: true, email: true } },
      },
      orderBy: { issuedDate: "desc" },
    })
    return { success: true, data: notices }
  } catch (error: any) {
    console.error("Error fetching notices for user:", error)
    return { success: false, error: error.message || "Failed to fetch notices." }
  }
}

// New: Get Notice Details
export async function getNoticeDetails(noticeId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }
  try {
    const notice = await prisma.notice.findUnique({
      where: { id: noticeId },
      include: {
        property: { select: { id: true, name: true, address: true } },
        issuedBy: { select: { id: true, name: true, email: true } },
        issuedTo: { select: { id: true, name: true, email: true } },
      },
    })
    if (!notice) {
      return { success: false, error: "Notice not found." }
    }
    // Basic authorization check
    const isAuthorized =
      notice.issuedById === session.user.id ||
      notice.issuedToId === session.user.id ||
      notice.property.addedById === session.user.id ||
      notice.property.tenants.some((tenant) => tenant.id === session.user.id)
    if (!isAuthorized) {
      return { success: false, error: "Not authorized to view this notice." }
    }
    return { success: true, data: notice }
  } catch (error: any) {
    console.error("Error fetching notice details:", error)
    return { success: false, error: error.message || "Failed to fetch notice details." }
  }
}

// New: Create Notice
export async function createNotice(prevState: any, formData: FormData) {
  const propertyId = formData.get("propertyId") as string
  const issuedToId = formData.get("issuedToId") as string
  const title = formData.get("title") as string
  const noticeType = formData.get("noticeType") as string
  const content = formData.get("content") as string
  const issuedDate = formData.get("issuedDate") as string
  const effectiveDate = formData.get("effectiveDate") as string

  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "User not authenticated." }
  }

  try {
    const newNotice = await prisma.notice.create({
      data: {
        propertyId,
        issuedById: session.user.id, // The user creating the notice
        issuedToId,
        title,
        content,
        noticeType,
        issuedDate: new Date(issuedDate),
        effectiveDate: new Date(effectiveDate),
      },
    })
    return { success: true, message: `Notice "${newNotice.title}" created successfully!` }
  } catch (error: any) {
    console.error("Error creating notice:", error)
    return { success: false, error: error.message || "Failed to create notice." }
  }
}

// New: Check Invite Token (for invite acceptance flow)
export async function checkInviteToken(token: string) {
  const supabase = getSupabaseClient()
  try {
    // Supabase's inviteUserByEmail handles token verification internally.
    // This function would typically be used to fetch user details associated with the token
    // before the user completes the signup/acceptance process.
    // For simplicity, we'll just check if a user can be retrieved with the token.
    // In a real app, you'd likely have a custom table for invites with more robust token management.
    const { data: user, error } = await supabase.auth.getUser(token) // This might not work directly with invite tokens
    if (error || !user) {
      return { success: false, error: error?.message || "Invalid or expired invite token." }
    }
    return { success: true, data: user.user, message: "Invite token is valid." }
  } catch (error: any) {
    console.error("Error checking invite token:", error)
    return { success: false, error: error.message || "Failed to check invite token." }
  }
}

// New: Accept Invite (completes the invited user's signup)
export async function acceptInvite(prevState: any, formData: FormData) {
  const password = formData.get("password") as string
  const token = formData.get("token") as string // The token from the invite link

  const supabase = getSupabaseClient()

  try {
    // This function is typically called after the user clicks the invite link
    // and is redirected to a page where they set their password.
    // Supabase's `verifyOtp` with `email_signup` type is used for this.
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "signup",
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Set the password for the invited user
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    })

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true, message: "Account created successfully! You can now sign in." }
  } catch (error: any) {
    console.error("Error accepting invite:", error)
    return { success: false, error: error.message || "Failed to accept invite." }
  }
}
