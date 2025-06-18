import { Button } from "@/components/ui/button"
import { PricingTiers } from "@/components/pricing-tiers"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Streamline Your Property Management
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-100 md:text-xl">
                KBT Assist helps landlords and property managers simplify operations, track maintenance, and manage
                tenants with ease.
              </p>
            </div>
            <div className="space-x-4">
              <Link href="#pricing">
                <Button variant="secondary" size="lg">
                  View Our Offers
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers Section */}
      <div id="pricing">
        <PricingTiers />
      </div>

      {/* Placeholder for other sections */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">More Features Coming Soon!</h2>
          <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl mt-4">
            We are constantly working to bring you more powerful tools for efficient property management.
          </p>
        </div>
      </section>
    </div>
  )
}
