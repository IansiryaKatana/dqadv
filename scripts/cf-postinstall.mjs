import { spawnSync } from 'node:child_process'

// Workers Builds defaults to `npx wrangler deploy` with no separate build step.
// Build the Cloudflare Vite output during install when running in Workers CI.
if (process.env.WORKERS_CI !== '1') {
  process.exit(0)
}

console.log('[cf-postinstall] WORKERS_CI detected — running Cloudflare Vite build…')
const result = spawnSync(
  'npm',
  ['run', 'build:cloudflare'],
  { stdio: 'inherit', shell: true, env: process.env },
)

process.exit(result.status ?? 1)
