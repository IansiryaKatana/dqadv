import type { AdminSelectOption } from './components/AdminSelect'

export const ADMIN_STATUS_OPTIONS: AdminSelectOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
]

export const ADMIN_FULFILLMENT_OPTIONS: AdminSelectOption[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
]

export const ADMIN_PAYMENT_STATUS_OPTIONS: AdminSelectOption[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

export const ADMIN_STRIPE_MODE_OPTIONS: AdminSelectOption[] = [
  { value: 'test', label: 'Test' },
  { value: 'live', label: 'Live' },
]

export const ADMIN_PAYPAL_MODE_OPTIONS: AdminSelectOption[] = [
  { value: 'sandbox', label: 'Sandbox' },
  { value: 'live', label: 'Live' },
]

export const ADMIN_VIDEO_TYPE_OPTIONS: AdminSelectOption[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'upload', label: 'Upload' },
]
