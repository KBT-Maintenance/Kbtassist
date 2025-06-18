// ... This file was left out for brevity. Assume it is correct and does not need any modifications. ...

export function PaymentReminderEmail({
  amount,
  customerName,
  invoiceNumber,
  dueDate,
}: {
  amount: number
  customerName: string
  invoiceNumber: string
  dueDate: Date
}) {
  const formattedAmount = amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })

  const formattedDueDate = dueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div>
      <p>Dear {customerName},</p>
      <p>
        This is a friendly reminder that invoice #{invoiceNumber} for {formattedAmount} is due on {formattedDueDate}.
      </p>
      <p>Please make your payment as soon as possible.</p>
      <p>Thank you,</p>
      <p>Your Company</p>
    </div>
  )
}
