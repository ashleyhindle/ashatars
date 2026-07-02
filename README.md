# Ashatars

Bun-managed TypeScript Cloudflare Worker for deterministic SVG avatars.

## Scripts

- `bun install` installs project-local tooling, including Wrangler.
- `bun test` runs the Worker smoke tests.
- `bun run dev` starts `wrangler dev` for local Worker development.

## Routes

- `/` returns a minimal service response in this scaffold slice.
- `/:seed.svg` is reserved for deterministic SVG generation in the next slice.

Custom-domain deployment is intentionally left as a placeholder in `wrangler.jsonc`.
