import {
  createAvatarSvg,
  DEFAULT_VIBE,
  SUPPORTED_AVATAR_TYPES,
  SUPPORTED_VIBES,
  VIBES,
} from "./avatar";

export interface Env {}

const SVG_HEADERS = {
  "content-type": "image/svg+xml; charset=utf-8",
  "cache-control": "public, max-age=31536000, immutable",
  "access-control-allow-origin": "*",
} as const;

function textResponse(body: string, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "text/plain; charset=utf-8");
  }

  return new Response(body, {
    ...init,
    headers,
  });
}

function htmlResponse(body: string, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "text/html; charset=utf-8");

  return new Response(body, {
    ...init,
    headers,
  });
}

export function handleRequest(request: Request): Response {
  const url = new URL(request.url);

  if (request.method !== "GET" && request.method !== "HEAD") {
    return textResponse("Method not allowed", {
      status: 405,
      headers: {
        allow: "GET, HEAD",
      },
    });
  }

  if (url.pathname === "/") {
    return htmlResponse(renderHomepage());
  }

  if (/^\/[^/]+\.svg$/.test(url.pathname)) {
    const request = parseAvatarRequest(url);
    if (!request) {
      return textResponse("Invalid avatar seed\n", {
        status: 400,
      });
    }

    const avatar = createAvatarSvg(request);

    if (!avatar.ok) {
      return textResponse(`${avatar.error.message}\n`, {
        status: 400,
      });
    }

    return new Response(avatar.value.svg, {
      headers: SVG_HEADERS,
    });
  }

  return textResponse("Not found\n", {
    status: 404,
  });
}

export default {
  fetch(request: Request, _env: Env, _ctx: ExecutionContext): Response {
    return handleRequest(request);
  },
};

function parseAvatarRequest(url: URL): Parameters<typeof createAvatarSvg>[0] | undefined {
  let seed: string;
  try {
    seed = decodeURIComponent(url.pathname.slice(1, -".svg".length));
  } catch {
    return undefined;
  }
  const repeatedTypes = url.searchParams.getAll("type");
  const type = repeatedTypes.length === 1 ? repeatedTypes[0] : null;
  const types = url.searchParams.getAll("types").join(",");

  return {
    seed,
    type,
    repeatedTypes: repeatedTypes.length > 1 ? repeatedTypes : [],
    types: types || null,
    vibe: url.searchParams.get("vibe"),
  };
}

export function renderHomepage(): string {
  const seed = "ashley@fuel.build";
  const vibeOptions = SUPPORTED_VIBES.map((vibe) => {
    const selected = vibe === DEFAULT_VIBE ? " selected" : "";
    return `<option value="${escapeAttribute(vibe)}"${selected}>${escapeText(VIBES[vibe].label)}</option>`;
  }).join("");
  const cards = SUPPORTED_AVATAR_TYPES.map((type) => {
    const href = avatarPath(seed, type, DEFAULT_VIBE);

    return [
      `<article class="avatar-card" data-avatar-type="${escapeAttribute(type)}">`,
      `<a href="${escapeAttribute(href)}" aria-label="Open ${escapeAttribute(type)} avatar SVG">`,
      `<img src="${escapeAttribute(href)}" data-seed="${escapeAttribute(seed)}" data-type="${escapeAttribute(type)}" alt="${escapeAttribute(type)} avatar for ${escapeAttribute(seed)}" width="512" height="512"/>`,
      "</a>",
      `<h2>${escapeText(type)}</h2>`,
      `<p><code>type=${escapeText(type)}</code></p>`,
      "</article>",
    ].join("");
  }).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Ashatars SVG gallery</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f7f2ea;
        color: #141414;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          linear-gradient(135deg, rgba(255, 247, 223, 0.94), rgba(215, 232, 255, 0.86) 52%, rgba(236, 252, 203, 0.72)),
          #f7f2ea;
      }

      main {
        width: min(1180px, calc(100% - 32px));
        margin: 0 auto;
        padding: 32px 0 48px;
      }

      .masthead {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 24px;
        align-items: end;
        padding: 12px 0 24px;
      }

      h1 {
        margin: 0 0 10px;
        font-size: clamp(2rem, 6vw, 4.8rem);
        line-height: 0.95;
        letter-spacing: 0;
      }

      .lede {
        max-width: 720px;
        margin: 0;
        color: #374151;
        font-size: 1.05rem;
        line-height: 1.6;
      }

      .controls {
        display: grid;
        gap: 8px;
        min-width: 210px;
      }

      label {
        color: #374151;
        font-size: 0.82rem;
        font-weight: 700;
        text-transform: uppercase;
      }

      select {
        min-height: 44px;
        border: 1px solid rgba(20, 20, 20, 0.24);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.84);
        color: #141414;
        padding: 0 12px;
        font: inherit;
      }

      .gallery {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(168px, 1fr));
        gap: 16px;
      }

      @media (min-width: 1040px) {
        .gallery {
          grid-template-columns: repeat(5, 1fr);
        }
      }

      .avatar-card {
        border: 1px solid rgba(20, 20, 20, 0.14);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.7);
        padding: 12px;
      }

      .avatar-card a {
        display: block;
      }

      img {
        display: block;
        width: 100%;
        height: auto;
        aspect-ratio: 1;
        border-radius: 6px;
        box-shadow: 0 16px 40px rgba(20, 20, 20, 0.14);
      }

      h2 {
        margin: 12px 0 4px;
        font-size: 1rem;
        line-height: 1.25;
      }

      p {
        margin: 0;
      }

      code {
        color: #4b5563;
        font-size: 0.86rem;
      }

      .docs {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-top: 22px;
      }

      .doc {
        border-top: 1px solid rgba(20, 20, 20, 0.18);
        padding-top: 12px;
      }

      .doc h2 {
        margin-top: 0;
      }

      .doc p {
        color: #374151;
        line-height: 1.55;
      }

      @media (max-width: 720px) {
        main {
          width: min(100% - 24px, 1180px);
          padding-top: 20px;
        }

        .masthead,
        .docs {
          grid-template-columns: 1fr;
        }
      }

      @media (prefers-color-scheme: dark) {
        :root {
          background: #121212;
          color: #f8fafc;
        }

        body {
          background:
            linear-gradient(135deg, rgba(24, 24, 27, 0.98), rgba(30, 64, 175, 0.72) 52%, rgba(20, 83, 45, 0.64)),
            #121212;
        }

        .lede,
        label,
        .doc p,
        code {
          color: #d1d5db;
        }

        select,
        .avatar-card {
          border-color: rgba(255, 255, 255, 0.18);
          background: rgba(17, 24, 39, 0.72);
          color: #f8fafc;
        }

        .doc {
          border-top-color: rgba(255, 255, 255, 0.2);
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="masthead" aria-labelledby="title">
        <div>
          <h1 id="title">Ashatars</h1>
          <p class="lede">Deterministic SVG avatars for one seed. These examples use <code>${escapeText(seed)}</code>; choose a vibe to update every local avatar URL together.</p>
        </div>
        <div class="controls">
          <label for="vibe">Vibe</label>
          <select id="vibe" name="vibe">${vibeOptions}</select>
        </div>
      </section>
      <section class="gallery" aria-label="Avatar type gallery">${cards}</section>
      <section class="docs" aria-label="Route documentation">
        <article class="doc">
          <h2>Route</h2>
          <p><code>/:seed.svg</code> returns an SVG avatar. Example: <code>/ashley@fuel.build.svg?type=dots&amp;vibe=ocean</code>.</p>
        </article>
        <article class="doc">
          <h2>Types</h2>
          <p><code>type</code> selects one generator. Repeated <code>type</code> values or comma-separated <code>types</code> choose one supported type deterministically.</p>
        </article>
        <article class="doc">
          <h2>Vibes</h2>
          <p><code>vibe</code> selects the shared palette. Unsupported type or vibe values return <code>400</code>.</p>
        </article>
      </section>
    </main>
    <script>
      const select = document.querySelector("#vibe");
      const updateGallery = () => {
        document.querySelectorAll("img[data-seed][data-type]").forEach((img) => {
          const seed = img.dataset.seed;
          const type = img.dataset.type;
          const next = "/" + encodeURIComponent(seed) + ".svg?type=" + encodeURIComponent(type) + "&vibe=" + encodeURIComponent(select.value);
          img.src = next;
          img.closest("a").href = next;
        });
      };

      select.addEventListener("change", updateGallery);
    </script>
  </body>
</html>`;
}

function avatarPath(seed: string, type: string, vibe: string): string {
  return `/${encodeURIComponent(seed)}.svg?type=${encodeURIComponent(type)}&vibe=${encodeURIComponent(vibe)}`;
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
