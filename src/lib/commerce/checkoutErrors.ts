const FRIENDLY_MESSAGES = [
  'Your gift is empty.',
  'Name and email are required.',
  'Please complete all required delivery fields.',
  'Online payment is temporarily unavailable. Please try again later or use bank transfer below.',
  'We could not connect to our payment provider. Please try again in a few minutes.',
  'Something went wrong completing your gift. Please try again or contact us for help.',
] as const

function isTechnicalMessage(message: string) {
  return /stripe|supabase|env|webhook|api.?key|secret|not configured|ECONNREFUSED|fetch failed/i.test(
    message,
  )
}

export function getCheckoutErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.trim() : ''

  if (FRIENDLY_MESSAGES.includes(message as (typeof FRIENDLY_MESSAGES)[number])) {
    return message
  }

  if (message.includes('requires a configured gift amount') || message.includes('free request item')) {
    const title = message.match(/^"(.+)" (?:requires|is a free)/)?.[1]
    return title
      ? `"${title}" cannot be paid for in checkout. Remove it from your gift, or request a free copy instead.`
      : 'One or more items cannot be paid for in checkout. Remove free items or request a free copy instead.'
  }

  if (message === 'Could not create checkout session.' || isTechnicalMessage(message)) {
    return message === 'Could not create checkout session.'
      ? 'We could not connect to our payment provider. Please try again in a few minutes.'
      : 'Online payment is temporarily unavailable. Please try again later or use bank transfer below.'
  }

  return 'Something went wrong completing your gift. Please try again or contact us for help.'
}
