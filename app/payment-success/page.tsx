import { CheckCircleIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-green-50 px-4 py-12 dark:bg-green-950">
      <div className="max-w-md space-y-6 rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-800">
        <CheckCircleIcon className="mx-auto h-20 w-20 text-green-500" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Payment Successful!</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Your payment has been processed successfully. Thank you for your purchase.
        </p>
        <Button asChild className="w-full">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
