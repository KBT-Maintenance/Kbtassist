import { ModeToggle } from "@/components/mode-toggle"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Hello KbtAssist!</h1>
      <p className="text-lg mb-4">This is a minimal deployment test.</p>
      <ModeToggle />
      <p className="mt-8 text-sm text-gray-500">If you see this, the deployment was successful!</p>
    </main>
  )
}
