import NextAuth from "next-auth"
import authOptions from "@/auth" // Assuming "@/auth" exports authOptions as default

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

// Explicitly export authOptions as a named export, as required by the build system.
// This line is crucial for resolving the recurring error.
export { authOptions }
