export type IntegrationSettings = {
  stripePublishableKey: string
  stripeSecretKey: string
  stripeWebhookSecret: string
  stripeMode: 'test' | 'live'
  stripeEnabled: boolean
  paypalClientId: string
  paypalClientSecret: string
  paypalMode: 'sandbox' | 'live'
  paypalEnabled: boolean
  resendApiKey: string
  emailFromName: string
  emailFromAddress: string
  emailAdminNotify: string
}

export type PublicPaymentOptions = {
  stripeEnabled: boolean
  paypalEnabled: boolean
  stripePublishableKey: string
}

export type MaskedIntegrationSettings = {
  stripePublishableKey: string
  stripeSecretKeyMasked: string
  stripeWebhookSecretMasked: string
  stripeMode: 'test' | 'live'
  stripeEnabled: boolean
  stripeConfigured: boolean
  paypalClientId: string
  paypalClientSecretMasked: string
  paypalMode: 'sandbox' | 'live'
  paypalEnabled: boolean
  paypalConfigured: boolean
  resendApiKeyMasked: string
  resendConfigured: boolean
  emailFromName: string
  emailFromAddress: string
  emailAdminNotify: string
}
