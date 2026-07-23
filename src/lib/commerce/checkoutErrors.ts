const FRIENDLY_MESSAGES = [
  'Your gift is empty.',
  'Name and email are required.',
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

  if (message.includes('requires a configured gift amount')) {
    const title = message.match(/^"(.+)" requires/)?.[1]
    return title
      ? `"${title}" needs a gift amount before checkout. Please contact us for help.`
      : 'One or more gifts need an amount before checkout. Please contact us for help.'
  }

  if (message === 'Could not create checkout session.' || isTechnicalMessage(message)) {
    return message === 'Could not create checkout session.'
      ? 'We could not connect to our payment provider. Please try again in a few minutes.'
      : 'Online payment is temporarily unavailable. Please try again later or use bank transfer below.'
  }

  return 'Something went wrong completing your gift. Please try again or contact us for help.'
}
