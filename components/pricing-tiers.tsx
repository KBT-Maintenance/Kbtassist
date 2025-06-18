"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckIcon } from "lucide-react"

interface PricingTierProps {
  title: string
  price: string
  features: string[]
  description: string
  buttonText: string
  isPopular?: boolean
}

const PricingTier = ({ title, price, features, description, buttonText, isPopular }: PricingTierProps) => (
  <Card
    className={`flex flex-col rounded-lg border ${
      isPopular ? "border-blue-500 shadow-lg" : "border-gray-200 dark:border-gray-700"
    } bg-white p-6 text-center dark:bg-gray-800`}
  >
    {isPopular && (
      <div className="absolute -top-3 right-1/2 translate-x-1/2 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold uppercase text-white">
        Most Popular
      </div>
    )}
    <CardHeader>
      <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</CardTitle>
      <CardDescription className="mt-2 text-gray-600 dark:text-gray-400">{description}</CardDescription>
      <div className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-gray-100">{price}</div>
    </CardHeader>
    <CardContent className="flex-grow">
      <ul className="mt-6 space-y-2 text-gray-700 dark:text-gray-300">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center justify-center">
            <CheckIcon className="mr-2 h-5 w-5 text-green-500" />
            {feature}
          </li>
        ))}
      </ul>
    </CardContent>
    <CardFooter>
      <Button className={`mt-8 w-full ${isPopular ? "bg-blue-600 hover:bg-blue-700" : ""}`}>{buttonText}</Button>
    </CardFooter>
  </Card>
)

export function PricingTiers() {
  const tiers = [
    {
      title: "Basic",
      price: "£19/month",
      description: "Ideal for single property owners.",
      features: ["1 Property", "Tenant Management", "Issue Tracking", "Basic Reports"],
      buttonText: "Get Started",
    },
    {
      title: "Pro",
      price: "£49/month",
      description: "Perfect for growing portfolios.",
      features: ["Up to 5 Properties", "Advanced Reporting", "Contractor Marketplace", "Email Support"],
      buttonText: "Choose Pro",
      isPopular: true,
    },
    {
      title: "Enterprise",
      price: "Custom",
      description: "Tailored for large-scale operations.",
      features: ["Unlimited Properties", "Dedicated Support", "Custom Integrations", "API Access"],
      buttonText: "Contact Sales",
    },
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple, Transparent Pricing</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Choose the plan that fits your property management needs.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier, index) => (
            <PricingTier key={index} {...tier} />
          ))}
        </div>
      </div>
    </section>
  )
}
