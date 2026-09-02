type NodeCrypto = typeof import('node:crypto')

function nodeCrypto(): NodeCrypto {
  const builtin = (
    globalThis as { process?: { getBuiltinModule?: (id: string) => NodeCrypto } }
  ).process?.getBuiltinModule
  if (typeof builtin === 'function') {
    return builtin('node:crypto')
  }
  throw new Error('Encryption is only available on the server.')
}

const ALGO = 'aes-256-gcm'
const IV_LEN = 12

function getKey(): Buffer | null {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY?.trim()
  if (!raw) return null
  return nodeCrypto().createHash('sha256').update(raw).digest()
}

export function encryptSecret(plaintext: string): string {
  const key = getKey()
  if (!key || !plaintext) return plaintext
  const crypto = nodeCrypto()
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `enc:${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`
}

export function decryptSecret(stored: string): string {
  if (!stored.startsWith('enc:')) return stored
  const key = getKey()
  if (!key) return ''
  const [, ivB64, tagB64, dataB64] = stored.split(':')
  if (!ivB64 || !tagB64 || !dataB64) return ''
  const crypto = nodeCrypto()
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64url')), decipher.final()]).toString('utf8')
}

export function maskSecret(value: string, visible = 4): string {
  if (!value) return ''
  if (value.length <= visible) return '••••'
  return `${'•'.repeat(Math.min(12, value.length - visible))}${value.slice(-visible)}`
}
