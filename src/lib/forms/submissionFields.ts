export const CONTACT_FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  message: 'Message',
}

export const FREE_QURAN_FIELD_LABELS: Record<string, string> = {
  productTitle: 'Product',
  quantity: 'Quantity',
  fullName: 'Full name',
  email: 'Email',
  phone: 'Phone',
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2',
  city: 'City',
  state: 'State / county',
  postalCode: 'Postal code',
  country: 'Country',
  note: 'Note',
}

export const FREE_QURAN_SECTIONS: { title: string; keys: string[] }[] = [
  {
    title: 'Request',
    keys: ['productTitle', 'quantity', 'fullName', 'email', 'phone'],
  },
  {
    title: 'Delivery',
    keys: ['addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country', 'note'],
  },
]

export const DISTRIBUTOR_FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  firstName: 'First name',
  lastName: 'Last name',
  companyName: 'Company / organisation',
  email: 'Email',
  website: 'Website',
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2',
  city: 'City',
  country: 'Country',
  stateProvince: 'State / province',
  zipPostalCode: 'ZIP / postal code',
  primaryPhone: 'Primary phone',
  secondaryPhone: 'Secondary phone',
  hearAboutUs: 'How they heard about us',
  contactReason: 'Why they contacted us',
  channelDescription: 'Distribution channel',
  distributingCountry: 'Distributing country',
  distributingArea: 'Distributing area',
  storageLocation: 'Storage location',
  distributeTo: 'Who they distribute to',
  raisingFunds: 'Raising funds',
  approximateQuantity: 'Approximate quantity',
  whyDistribute: 'Why they want to distribute',
  yearsInBusiness: 'Years in business',
  companyDescription: 'Company description',
}

export const DISTRIBUTOR_SECTIONS: { title: string; keys: string[] }[] = [
  {
    title: 'Applicant',
    keys: ['title', 'firstName', 'lastName', 'companyName', 'email', 'website'],
  },
  {
    title: 'Location',
    keys: [
      'addressLine1',
      'addressLine2',
      'city',
      'stateProvince',
      'zipPostalCode',
      'country',
      'primaryPhone',
      'secondaryPhone',
    ],
  },
  {
    title: 'Distribution',
    keys: [
      'hearAboutUs',
      'contactReason',
      'channelDescription',
      'distributingCountry',
      'distributingArea',
      'storageLocation',
      'distributeTo',
      'raisingFunds',
      'approximateQuantity',
    ],
  },
  {
    title: 'About the organisation',
    keys: ['whyDistribute', 'yearsInBusiness', 'companyDescription'],
  },
]
