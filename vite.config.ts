import path from 'node:path'
import os from 'node:os'
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'
import { nitro } from 'nitro/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Workers Builds sets WORKERS_CI=1. Prefer Cloudflare adapter there unless overridden.
const deployTarget =
  process.env.DEPLOY_TARGET ??
  (process.env.WORKERS_CI === '1' ? 'cloudflare' : 'nitro')

export default defineConfig({
  // Keep Vite's dep cache outside the repo to avoid Windows EPERM rename races.
  cacheDir: path.join(os.tmpdir(), 'dq-vite'),
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    ...(deployTarget === 'cloudflare'
      ? [
          cloudflare({ viteEnvironment: { name: 'ssr' } }),
          tanstackStart(),
          viteReact(),
        ]
      : [
          tanstackStart(),
          deployTarget === 'netlify' ? netlify() : nitro(),
          viteReact(),
        ]),
  ],
})
