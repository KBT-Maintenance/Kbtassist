// app/api/auth/[...nextauth]/route.ts
import NextAuthHandler, { authOptions } from "@/auth"

export { NextAuthHandler as GET, NextAuthHandler as POST }

// Also export authOptions as a named export, as required by Vercel's build system
export { authOptions }
