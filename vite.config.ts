import path from 'node:path'
import os from 'node:os'
import { defineConfig, type Plugin } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'
import { nitro } from 'nitro/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** Vite's default node:crypto browser stub throws on import. Export real functions so server-only modules can load in the client graph. */
function stubNodeCryptoOnClient(): Plugin {
  const stubId = '\0stub-node-crypto'
  return {
    name: 'stub-node-crypto-on-client',
    enforce: 'pre',
    resolveId(id, _importer, options) {
      if (id === 'node:crypto' && !options?.ssr) return stubId
    },
    load(id) {
      if (id !== stubId) return
      return `
        const fail = () => {
          throw new Error('node:crypto is only available on the server')
        }
        export const createCipheriv = fail
        export const createDecipheriv = fail
        export const randomBytes = fail
        export const createHash = () => ({ update() { return this }, digest: fail })
        export default { createCipheriv: fail, createDecipheriv: fail, randomBytes: fail, createHash }
      `
    },
  }
}

// Workers Builds sets WORKERS_CI=1. Prefer Cloudflare adapter there unless overridden.
const deployTarget =
  process.env.DEPLOY_TARGET ??
  (process.env.WORKERS_CI === '1' ? 'cloudflare' : 'nitro')

export default defineConfig(({ command }) => ({
  // Keep Vite's dep cache outside the repo to avoid Windows EPERM rename races.
  cacheDir: path.join(os.tmpdir(), 'dq-vite'),
  resolve: { tsconfigPaths: true },
  plugins: [
    stubNodeCryptoOnClient(),
    tailwindcss(),
    ...(deployTarget === 'cloudflare'
      ? [
          cloudflare({ viteEnvironment: { name: 'ssr' } }),
          tanstackStart(),
          viteReact(),
        ]
      : [
          tanstackStart(),
          // Nitro's Vite env often 503s on slow Windows cold starts (entry wait ~3s).
          // Use Nitro for builds only; TanStack Start handles local vite SSR.
          ...(deployTarget === 'netlify'
            ? [netlify()]
            : command === 'build'
              ? [nitro()]
              : []),
          viteReact(),
        ]),
  ],
}))
