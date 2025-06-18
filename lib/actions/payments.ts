"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import authOptions from "@/auth"
import Stripe from "stripe"
import { InvoiceStatus } from "@prisma/client"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
})

export async function createCheckoutSession(invoiceId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { success: false, error: "Not authorized." }
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        property: true,
        tenant: true,
      },
    })

    if (!invoice || invoice.tenantId !== session.user.id) {
      return { success: false, error: "Invoice not found or not authorized." }
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return { success: false, error: "Invoice already paid." }
    }

    const lineItems = [
      {
        price_data: {
          currency: "gbp", // Assuming GBP as currency
          product_data: {
            name: `Rent for ${invoice.property.name} - ${invoice.property.address}`,
            description: invoice.description || `Invoice #${invoice.id}`,
          },
          unit_amount: Math.round(invoice.amount * 100), // Amount in pence
        },
        quantity: 1,
      },
    ]

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-cancel`,
      metadata: {
        invoiceId: invoice.id,
        tenantId: invoice.tenantId,
      },
      customer_email: invoice.tenant.email,
    })

    return { success: true, url: stripeSession.url }
  } catch (error: any) {
    console.error("Error creating Stripe checkout session:", error)
    return { success: false, error: error.message || "Failed to create checkout session." }
  }
}

export async function markPaymentAsPaid(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === "paid" && session.metadata?.invoiceId) {
      const invoiceId = session.metadata.invoiceId
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: InvoiceStatus.PAID },
      })

      // Optionally create a rent payment record
      await prisma.rentPayment.create({
        data: {
          invoiceId: invoiceId,
          tenantId: session.metadata.tenantId!,
          amount: session.amount_total! / 100, // Convert back to pounds
          paymentDate: new Date(),
          paymentMethod: session.payment_method_types[0] || "Stripe",
        },
      })

      return { success: true, message: "Payment successfully recorded and invoice marked as paid." }
    } else {
      return { success: false, error: "Payment not successful or invoice ID missing." }
    }
  } catch (error: any) {
    console.error("Error marking payment as paid:", error)
    return { success: false, error: error.message || "Failed to process payment." }
  }
}
