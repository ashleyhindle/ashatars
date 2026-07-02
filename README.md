# Ashatars

Bun-managed TypeScript Cloudflare Worker for deterministic SVG avatars.

## Scripts

- `bun install` installs project-local tooling, including Wrangler.
- `bun test` runs the Worker smoke tests.
- `bun run dev` starts `wrangler dev` for local Worker development.

## Routes

- `/` returns the local docs/gallery homepage with generated examples for `ashley@fuel.build`.
- `/:seed.svg` returns a deterministic SVG avatar.

Examples:

- `/ashley@fuel.build.svg?type=dots&vibe=ocean`
- `/7db79f08-6b58-434d-a58d-3309b9eb0975.svg?types=dots,dots&vibe=daybreak`

`type=<name>` selects one generator. Repeated `type` values or comma-separated `types` choose one supported generator deterministically. Invalid `type` or `vibe` values return `400`.

Custom-domain deployment is intentionally left as a placeholder in `wrangler.jsonc`.
