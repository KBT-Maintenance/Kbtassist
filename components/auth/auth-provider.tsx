"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string, role: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const fetchUser = useCallback(async () => {
    setLoading(true)
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser()
    setUser(fetchedUser)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setLoading(false)
      if (_event === "SIGNED_IN") {
        // Redirect based on role after sign-in
        const userRole = session?.user?.user_metadata?.role
        if (userRole) {
          router.push(`/${userRole}-dashboard`)
        } else {
          router.push("/welcome") // Default welcome for new sign-ups or if role not set
        }
      } else if (_event === "SIGNED_OUT") {
        router.push("/login")
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchUser, router])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Logged in successfully!",
      })
      // Redirection handled by onAuthStateChange
    }
    setLoading(false)
  }

  const signUp = async (name: string, email: string, password: string, role: string) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    })

    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      })
    } else if (data.user) {
      toast({
        title: "Sign Up Successful",
        description: "Please check your email to verify your account.",
      })
      // Redirection handled by onAuthStateChange after email verification (if enabled)
      // For now, redirect to welcome page immediately after successful sign-up
      router.push("/welcome")
    }
    setLoading(false)
  }

  const signOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Logged out successfully!",
      })
      // Redirection handled by onAuthStateChange
    }
    setLoading(false)
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
