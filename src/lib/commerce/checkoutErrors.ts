const FRIENDLY_MESSAGES = [
  'Your donation cart is empty.',
  'Your gift is empty.',
  'Name and email are required.',
  'Please complete all required delivery fields.',
  'Please enter a valid email address.',
  'Online payment is temporarily unavailable. Please try again later or use bank transfer below.',
  'We could not connect to our payment provider. Please try again in a few minutes.',
  'PayPal checkout is temporarily unavailable. Please try another payment method or use bank transfer below.',
  'Something went wrong with your donation. Please try again or contact us for help.',
  'Something went wrong completing your gift. Please try again or contact us for help.',
] as const

function isTechnicalMessage(message: string) {
  return /stripe|supabase|env|webhook|api.?key|secret|not configured|ECONNREFUSED|fetch failed|INTEGRATION_ENCRYPTION|decrypt/i.test(
    message,
  )
}

function extractMessage(error: unknown): string {
  if (!error) return ''
  if (typeof error === 'string') return error.trim()
  if (error instanceof Error) return error.message.trim()
  if (typeof error === 'object') {
    const record = error as Record<string, unknown>
    if (typeof record.message === 'string') return record.message.trim()
    if (typeof record.data === 'string') return record.data.trim()
    if (record.data && typeof record.data === 'object') {
      const nested = record.data as Record<string, unknown>
      if (typeof nested.message === 'string') return nested.message.trim()
    }
  }
  return ''
}

function parseProviderJsonMessage(message: string): string | null {
  if (!message.startsWith('{') && !message.includes('"message"')) return null
  try {
    const json = JSON.parse(message) as {
      message?: string
      name?: string
      details?: Array<{ issue?: string; description?: string }>
      error_description?: string
    }
    const detail = json.details?.[0]?.description || json.details?.[0]?.issue
    if (detail) return detail
    if (json.error_description) return json.error_description
    if (json.message && json.message.length < 180) return json.message
    if (json.name === 'AUTHENTICATION_FAILURE' || /invalid.?client/i.test(message)) {
      return 'PayPal could not authenticate. Please try again later or use bank transfer.'
    }
  } catch {
    return null
  }
  return null
}

export function getCheckoutErrorMessage(error: unknown): string {
  const message = extractMessage(error)

  if (!message) {
    return 'Something went wrong with your donation. Please try again or contact us for help.'
  }

  if (FRIENDLY_MESSAGES.includes(message as (typeof FRIENDLY_MESSAGES)[number])) {
    if (message === 'Your gift is empty.') return 'Your donation cart is empty.'
    if (message === 'Something went wrong completing your gift. Please try again or contact us for help.') {
      return 'Something went wrong with your donation. Please try again or contact us for help.'
    }
    return message
  }

  if (message.includes('requires a configured gift amount') || message.includes('free request item')) {
    const title = message.match(/^"(.+)" (?:requires|is a free)/)?.[1]
    return title
      ? `"${title}" cannot be paid for at checkout. Remove it from your cart, or request a free copy instead.`
      : 'One or more items cannot be paid for at checkout. Remove free items or request a free copy instead.'
  }

  const providerMessage = parseProviderJsonMessage(message)
  if (providerMessage) {
    return providerMessage.length > 160
      ? 'We could not start payment with PayPal. Please try again in a few minutes or use bank transfer below.'
      : providerMessage
  }

  if (/paypal/i.test(message) && /authenticat|token|client/i.test(message)) {
    return 'PayPal could not authenticate. Please try again later or use bank transfer.'
  }

  if (message === 'Could not create checkout session.' || message === 'Could not create PayPal order.') {
    return 'We could not connect to our payment provider. Please try again in a few minutes.'
  }

  if (isTechnicalMessage(message)) {
    return 'Online payment is temporarily unavailable. Please try again later or use bank transfer below.'
  }

  // Safe non-technical server messages (validation, mode mismatch, etc.)
  if (message.length <= 220 && !/[{\\[\\]<]/.test(message)) {
    return message
  }

  return 'Something went wrong with your donation. Please try again or contact us for help.'
}
