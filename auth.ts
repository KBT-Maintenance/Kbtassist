import NextAuth from "next-auth"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import type { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { UserRole } from "@prisma/client"

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const supabase = createClient(cookies())
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials?.email as string,
          password: credentials?.password as string,
        })

        if (error) {
          console.error("Supabase sign-in error:", error)
          return null
        }

        if (data.user) {
          // Fetch user role from your public.users table
          const { data: userProfile, error: profileError } = await supabase
            .from("users")
            .select("role, name")
            .eq("id", data.user.id)
            .single()

          if (profileError) {
            console.error("Error fetching user profile:", profileError)
            return null
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: userProfile?.name || data.user.email, // Use name from profile or email
            role: userProfile?.role || UserRole.TENANT, // Default role if not found
          }
        }
        return null
      },
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  callbacks: {
    async session({ session, user }) {
      const supabase = createClient(cookies())
      const { data: userProfile, error } = await supabase.from("users").select("role, name").eq("id", user.id).single()

      if (error) {
        console.error("Error fetching user profile in session callback:", error)
      }

      session.user.id = user.id
      session.user.role = userProfile?.role || UserRole.TENANT // Ensure role is always set
      session.user.name = userProfile?.name || user.name || user.email // Ensure name is set
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role // Cast to any to access custom role property
      }
      return token
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect to login page on error
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
