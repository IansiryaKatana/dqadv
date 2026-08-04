import { loadIntegrationSettings } from '#/lib/integrations/paymentConfig'

function paypalBaseUrl(mode: 'sandbox' | 'live') {
  return mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
}

export async function getPayPalAccessToken() {
  const config = await loadIntegrationSettings()
  if (!config.paypalClientId || !config.paypalClientSecret) {
    throw new Error('PayPal is not configured.')
  }

  const auth = Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString('base64')
  const res = await fetch(`${paypalBaseUrl(config.paypalMode)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const errBody = await res.text()
    let description = ''
    try {
      const json = JSON.parse(errBody) as { error?: string; error_description?: string }
      description = json.error_description || json.error || ''
    } catch {
      description = errBody
    }
    if (res.status === 401 || /invalid_client/i.test(description)) {
      throw new Error(
        `PayPal rejected these credentials for ${config.paypalMode} mode. Switch PayPal mode in Settings to match your Client ID/Secret (sandbox vs live), or update the keys.`,
      )
    }
    throw new Error(description || 'Could not authenticate with PayPal.')
  }
  const json = (await res.json()) as { access_token?: string; error_description?: string; error?: string }
  if (!json.access_token) {
    throw new Error(json.error_description || json.error || 'Could not authenticate with PayPal.')
  }
  return { token: json.access_token, mode: config.paypalMode }
}

export async function createPayPalOrder(params: {
  reference: string
  amount: number
  currency: string
  returnUrl: string
  cancelUrl: string
}) {
  const { token, mode } = await getPayPalAccessToken()
  const res = await fetch(`${paypalBaseUrl(mode)}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: params.reference,
          custom_id: params.reference,
          amount: {
            currency_code: params.currency.toUpperCase(),
            value: params.amount.toFixed(2),
          },
          description: `Donate Quran donation ${params.reference}`,
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        brand_name: 'Donate Quran',
        user_action: 'PAY_NOW',
        // Prefer card / guest pay UI; merchant must also enable “PayPal account optional”.
        landing_page: 'BILLING',
        // Address is collected on our checkout; don’t force PayPal shipping again.
        shipping_preference: 'NO_SHIPPING',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    let detail = err || 'Could not create PayPal order.'
    try {
      const json = JSON.parse(err) as {
        message?: string
        name?: string
        details?: Array<{ description?: string; issue?: string }>
      }
      detail =
        json.details?.[0]?.description ||
        json.details?.[0]?.issue ||
        json.message ||
        json.name ||
        detail
    } catch {
      // keep raw text
    }
    throw new Error(detail)
  }

  const json = (await res.json()) as {
    id: string
    links?: { rel: string; href: string }[]
  }

  const approve = json.links?.find((l) => l.rel === 'approve')
  if (!approve?.href) throw new Error('Could not get PayPal approval URL.')

  return { orderId: json.id, approvalUrl: approve.href }
}

export async function capturePayPalOrder(orderId: string) {
  const { token, mode } = await getPayPalAccessToken()
  const res = await fetch(`${paypalBaseUrl(mode)}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Could not capture PayPal payment.')
  }

  const json = (await res.json()) as {
    status: string
    purchase_units?: { payments?: { captures?: { id: string }[] } }[]
  }

  const captureId = json.purchase_units?.[0]?.payments?.captures?.[0]?.id
  return { status: json.status, captureId }
}

export async function verifyPayPalWebhook(headers: Headers, body: string) {
  const config = await loadIntegrationSettings()
  if (!config.paypalClientId || !config.paypalClientSecret) return false

  const { token, mode } = await getPayPalAccessToken()
  const res = await fetch(`${paypalBaseUrl(mode)}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: headers.get('paypal-auth-algo'),
      cert_url: headers.get('paypal-cert-url'),
      transmission_id: headers.get('paypal-transmission-id'),
      transmission_sig: headers.get('paypal-transmission-sig'),
      transmission_time: headers.get('paypal-transmission-time'),
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(body),
    }),
  })

  if (!res.ok) return false
  const json = (await res.json()) as { verification_status?: string }
  return json.verification_status === 'SUCCESS'
}
