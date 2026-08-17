const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function ordinal(day: number) {
  const remainder = day % 100
  if (remainder >= 11 && remainder <= 13) return `${day}th`
  switch (day % 10) {
    case 1:
      return `${day}st`
    case 2:
      return `${day}nd`
    case 3:
      return `${day}rd`
    default:
      return `${day}th`
  }
}

export function formatAdminDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${ordinal(date.getDate())} ${MONTHS[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`
}

export function formatAdminTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
}

export function formatAdminDateTime(value: string) {
  const date = formatAdminDate(value)
  const time = formatAdminTime(value)
  if (!date) return ''
  return time ? `${date}, ${time}` : date
}
