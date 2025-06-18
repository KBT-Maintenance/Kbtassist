import NextAuth from "next-auth"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import type { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from "@/lib/supabase/server"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/db"

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
        const supabase = createClient()
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
          const userProfile = await prisma.user.findUnique({
            where: { id: data.user.id },
            select: { role: true, name: true },
          })

          return {
            id: data.user.id,
            email: data.user.email,
            name: userProfile?.name || data.user.email,
            role: userProfile?.role || UserRole.TENANT,
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
      const userProfile = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, name: true },
      })

      session.user.id = user.id
      session.user.role = userProfile?.role || UserRole.TENANT
      session.user.name = userProfile?.name || user.name || user.email
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
