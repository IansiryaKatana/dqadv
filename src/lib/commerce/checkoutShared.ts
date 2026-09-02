export type ShippingAddress = {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export type DonorDetails = {
  donorName: string
  donorEmail: string
  donorPhone?: string
  dedication?: string
  donorUserId?: string | null
}

export type DonationCartSnapshot = {
  type: 'donation'
  amount: number
  frequency: 'one_time' | 'monthly'
}

export type QuranOrderCartSnapshot = {
  type: 'quran_order'
  mode: 'copies' | 'boxes'
  quantity: number
  copies: number
  boxes: number
  cost: number
  postage: number
  total: number
  label: string
}

export type CommerceSnapshot = DonationCartSnapshot | QuranOrderCartSnapshot

export function validateDonor(input: Pick<DonorDetails, 'donorName' | 'donorEmail'>) {
  if (!input.donorName.trim() || !input.donorEmail.trim()) {
    throw new Error('Name and email are required.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.donorEmail.trim())) {
    throw new Error('Please enter a valid email address.')
  }
}

export function validateUkAddress(address: ShippingAddress | null | undefined) {
  if (!address) throw new Error('Please complete all required delivery fields.')
  const { line1, city, state, postalCode, country } = address
  if (!line1.trim() || !city.trim() || !state.trim() || !postalCode.trim() || !country.trim()) {
    throw new Error('Please complete all required delivery fields.')
  }
}

export function parseCommerceSnapshot(value: unknown): CommerceSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const row = value as Record<string, unknown>
  if (row.type === 'donation') {
    const amount = Number(row.amount)
    if (!Number.isFinite(amount)) return null
    return {
      type: 'donation',
      amount,
      frequency: row.frequency === 'monthly' ? 'monthly' : 'one_time',
    }
  }
  if (row.type === 'quran_order') {
    return {
      type: 'quran_order',
      mode: row.mode === 'boxes' ? 'boxes' : 'copies',
      quantity: Number(row.quantity) || 0,
      copies: Number(row.copies) || 0,
      boxes: Number(row.boxes) || 0,
      cost: Number(row.cost) || 0,
      postage: Number(row.postage) || 0,
      total: Number(row.total) || 0,
      label: typeof row.label === 'string' ? row.label : 'Qur’an order',
    }
  }
  return null
}
