import path from 'node:path'
import os from 'node:os'
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

const deployTarget = process.env.DEPLOY_TARGET ?? 'nitro'

export default defineConfig({
  // Keep Vite's dep cache outside the repo to avoid Windows EPERM rename races.
  cacheDir: path.join(os.tmpdir(), 'dq-vite'),
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    deployTarget === 'netlify' ? netlify() : nitro(),
    viteReact(),
    cloudflare({
      viteEnvironment: {
        name: "ssr"
      }
    })
  ],
})