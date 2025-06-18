// ... This file was left out for brevity. Assume it is correct and does not need any modifications. ...

// Add 'export' to the SendNoticeForm function
export function SendNoticeForm({ properties, recipients, initialPropertyId }: SendNoticeFormProps) {
  // ... existing code ...
}

interface SendNoticeFormProps {
  properties: any[] // Replace 'any' with the actual type of your properties
  recipients: any[] // Replace 'any' with the actual type of your recipients
  initialPropertyId?: string // Replace 'string' with the actual type of your property ID, and '?' if it's optional
}
