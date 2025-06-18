import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { UserRole } from "@prisma/client"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  const { email, password, name, role } = await request.json()
  const supabase = createClient()

  try {
    // Check if user already exists in Supabase Auth
    const { data: existingAuthUsers, error: existingAuthError } = await supabase.auth.admin.listUsers({ email })

    if (existingAuthError) {
      console.error("Error listing users from Supabase Auth:", existingAuthError)
      return NextResponse.json({ error: existingAuthError.message }, { status: 500 })
    }

    if (existingAuthUsers.users.length > 0) {
      return NextResponse.json({ error: "User with this email already exists." }, { status: 409 })
    }

    // Create user in Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    })

    if (signUpError) {
      console.error("Supabase sign-up error:", signUpError)
      return NextResponse.json({ error: signUpError.message }, { status: 500 })
    }

    if (!data.user) {
      return NextResponse.json({ error: "User creation failed." }, { status: 500 })
    }

    // Create user profile in your public.users table
    await prisma.user.create({
      data: {
        id: data.user.id,
        email: data.user.email!,
        name,
        role: role as UserRole,
      },
    })

    return NextResponse.json(
      { message: "Sign up successful! Please check your email for a confirmation link." },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Unexpected error during sign-up:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 })
  }
}
