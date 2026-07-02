# Ashatars

Bun-managed TypeScript Cloudflare Worker for deterministic SVG avatars. The
Worker uses raw Cloudflare routing in `src/index.ts`: `fetch()` creates a
`URL`, serves `/` as the gallery/docs page, and serves only `/:seed.svg` as the
avatar endpoint.

## Scripts

- `bun install` installs project-local tooling, including Wrangler.
- `bun test` runs deterministic generator and Worker route tests.
- `bun run dev` starts `wrangler dev` for local Worker development.
- `bun run typecheck` runs `tsc --noEmit`.

## Routes

- `/` returns the local docs/gallery homepage with circular generated examples
  for `ashley@fuel.build`, a vibe selector, and a refresh button that swaps the
  whole gallery to a random UUID seed. The homepage and builder default to the
  `stealth` vibe.
- `/:seed.svg` returns a deterministic SVG avatar.
- `/avatar/:seed.svg` is intentionally absent and returns `404`.

Examples:

- `/ashley@fuel.build.svg?type=dots&vibe=ocean`
- `/7db79f08-6b58-434d-a58d-3309b9eb0975.svg?types=dots,lines,wave&vibe=stealth`

The avatar route accepts these query params:

- `type=<name>` selects one supported generator.
- Repeated `type`, such as `?type=dots&type=lines`, chooses one supported
  generator deterministically from that list.
- `types=a,b,c` chooses one supported generator deterministically from the
  comma-separated list.
- Omitted `type`/`types` chooses one public generator deterministically from
  every supported public type, matching the URL builder's empty or all-selected
  type state.
- `vibe=<name>` selects the shared palette/background role set. Omitted `vibe`
  uses `stealth`.

Invalid `type`, `types`, or `vibe` values return `400`. The same normalized
seed, selected type policy, and vibe always produce identical SVG bytes.

## Supported Inputs

Email seeds are trimmed and lowercased. UUID and other string seeds are trimmed
and otherwise preserved. Supported vibes are `daybreak`, `sunset`, `ocean`,
`forest`, `fire`, `crystal`, `ice`, `stealth`, and `bubble`.

Supported public types: `circles`, `lines`, `grid`, `diagonal_grid`, `squares`,
`mountains`, `zigzag_vertical`, `wiggles`, `sunrise`, `clock`, `dots`,
`concentric_arcs`, `iris`, `wave`, and `blob_face`.

Deferred public types: none. Public types from `refs/svgs.ex` are advertised in
the homepage gallery.

## HTTP Headers

Successful SVG responses include:

- `Content-Type: image/svg+xml; charset=utf-8`
- `Cache-Control: public, max-age=31536000, immutable`
- `Access-Control-Allow-Origin: *`

## Wrangler Deploy Notes

`wrangler.jsonc` contains deploy-ready Worker metadata, `main`,
`compatibility_date`, observability, and a placeholder custom-domain section.
Do not deploy this slice live until the production account/domain are confirmed.

When ready, replace the placeholder route with the real hostname:

```jsonc
"routes": [
  { "pattern": "avatars.example.com", "custom_domain": true }
]
```

Then run:

```bash
bun run typecheck
bun test
bunx wrangler deploy
```
