export type CountryOption = {
  code: string
  name: string
}

function regionCodes() {
  try {
    const codes = Intl.supportedValuesOf?.('region')
    if (Array.isArray(codes) && codes.length > 0) return codes
  } catch {
    // Some runtimes expose supportedValuesOf but reject the "region" key.
  }
  return FALLBACK_CODES
}

function loadCountries(): CountryOption[] {
  let names: Intl.DisplayNames | null = null
  try {
    names = new Intl.DisplayNames(['en'], { type: 'region' })
  } catch {
    names = null
  }

  const seen = new Set<string>()
  const options: CountryOption[] = []

  for (const code of regionCodes()) {
    if (!/^[A-Z]{2}$/.test(code) || EXCLUDED_CODES.has(code)) continue
    const name = names?.of(code)?.trim() || code
    if (!name || seen.has(name)) continue
    seen.add(name)
    options.push({ code, name })
  }

  return options.sort((a, b) => a.name.localeCompare(b.name, 'en'))
}

const EXCLUDED_CODES = new Set([
  'EU',
  'EZ',
  'UN',
  'QO',
  'XA',
  'XB',
  'ZZ',
])

const FALLBACK_CODES = [
  'AF', 'AL', 'DZ', 'AD', 'AO', 'AG', 'AR', 'AM', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY',
  'BE', 'BZ', 'BJ', 'BT', 'BO', 'BA', 'BW', 'BR', 'BN', 'BG', 'BF', 'BI', 'KH', 'CM', 'CA', 'CV',
  'CF', 'TD', 'CL', 'CN', 'CO', 'KM', 'CG', 'CD', 'CR', 'CI', 'HR', 'CU', 'CY', 'CZ', 'DK', 'DJ',
  'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET', 'FJ', 'FI', 'FR', 'GA', 'GM', 'GE',
  'DE', 'GH', 'GR', 'GD', 'GT', 'GN', 'GW', 'GY', 'HT', 'HN', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ',
  'IE', 'IL', 'IT', 'JM', 'JP', 'JO', 'KZ', 'KE', 'KI', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR',
  'LY', 'LI', 'LT', 'LU', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MR', 'MU', 'MX', 'FM', 'MD',
  'MC', 'MN', 'ME', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'NZ', 'NI', 'NE', 'NG', 'KP', 'MK',
  'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PL', 'PT', 'QA', 'RO', 'RU', 'RW',
  'KN', 'LC', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SK', 'SI', 'SB', 'SO',
  'ZA', 'KR', 'SS', 'ES', 'LK', 'SD', 'SR', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG',
  'TO', 'TT', 'TN', 'TR', 'TM', 'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UY', 'UZ', 'VU', 'VA', 'VE',
  'VN', 'YE', 'ZM', 'ZW',
]

export const COUNTRIES = loadCountries()

export function filterCountries(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return COUNTRIES
  return COUNTRIES.filter(
    (country) => country.name.toLowerCase().includes(q) || country.code.toLowerCase() === q,
  )
}
