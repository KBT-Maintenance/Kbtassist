import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckIcon } from "lucide-react"

export function PricingTiers() {
  const pricingPlans = [
    {
      name: "Basic",
      price: "£10/month",
      features: ["5 Properties", "Basic Reporting", "Email Support"],
      buttonText: "Get Started",
    },
    {
      name: "Pro",
      price: "£30/month",
      features: ["Unlimited Properties", "Advanced Reporting", "Priority Support", "Tenant Portal"],
      buttonText: "Choose Pro",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: ["All Pro Features", "Dedicated Account Manager", "Custom Integrations", "24/7 Phone Support"],
      buttonText: "Contact Us",
    },
  ]

  return (
    <section className="py-12 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Our Flexible Pricing</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Choose the plan that best fits your property management needs.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-12">
          {pricingPlans.map((plan, index) => (
            <Card key={index} className={plan.highlight ? "border-primary shadow-lg" : ""}>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-4xl font-extrabold mt-2">{plan.price}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <ul className="grid gap-2 text-sm text-muted-foreground">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full">{plan.buttonText}</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
