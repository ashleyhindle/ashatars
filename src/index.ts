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
    const label = type.replace(/_/g, " ");

    return [
      `<article class="avatar-item" data-avatar-type="${escapeAttribute(type)}">`,
      `<h2>${escapeText(label)}</h2>`,
      `<a href="${escapeAttribute(href)}" aria-label="Open ${escapeAttribute(type)} avatar SVG">`,
      `<img class="avatar-thumb" src="${escapeAttribute(href)}" data-seed="${escapeAttribute(seed)}" data-type="${escapeAttribute(type)}" alt="${escapeAttribute(type)} avatar for ${escapeAttribute(seed)}" width="512" height="512"/>`,
      "</a>",
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
        background: #f7f2ea;
      }

      main {
        width: min(1120px, calc(100% - 32px));
        margin: 0 auto;
        padding: 28px 0 44px;
      }

      .masthead {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 20px;
        align-items: end;
        padding: 8px 0 24px;
      }

      h1 {
        margin: 0 0 8px;
        font-size: clamp(2rem, 5vw, 4rem);
        line-height: 1;
        letter-spacing: 0;
      }

      .lede {
        max-width: 720px;
        margin: 0;
        color: #374151;
        font-size: 1rem;
        line-height: 1.5;
      }

      .controls {
        display: flex;
        gap: 8px;
        align-items: end;
        flex-wrap: wrap;
      }

      .control-field {
        display: grid;
        gap: 6px;
        min-width: 190px;
      }

      label {
        color: #374151;
        font-size: 0.82rem;
        font-weight: 700;
        text-transform: uppercase;
      }

      select,
      button {
        min-height: 44px;
        border: 1px solid rgba(20, 20, 20, 0.24);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.84);
        color: #141414;
        padding: 0 12px;
        font: inherit;
      }

      button {
        cursor: pointer;
        font-weight: 700;
      }

      button:focus-visible,
      select:focus-visible,
      a:focus-visible {
        outline: 3px solid rgba(37, 99, 235, 0.42);
        outline-offset: 3px;
      }

      .gallery {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
        gap: 22px 18px;
        align-items: start;
      }

      @media (min-width: 1040px) {
        .gallery {
          grid-template-columns: repeat(5, 1fr);
        }
      }

      .avatar-item {
        min-width: 0;
        text-align: center;
      }

      .avatar-item a {
        display: block;
        border-radius: 999px;
      }

      img {
        display: block;
        width: 100%;
        height: auto;
        aspect-ratio: 1;
        border-radius: 50%;
        overflow: hidden;
        object-fit: cover;
        border: 1px solid rgba(20, 20, 20, 0.16);
        box-shadow: 0 12px 26px rgba(20, 20, 20, 0.14);
      }

      h2 {
        margin: 0 0 8px;
        font-size: 0.96rem;
        line-height: 1.25;
        text-transform: capitalize;
        overflow-wrap: anywhere;
      }

      p {
        margin: 0;
      }

      code {
        color: #4b5563;
        font-size: 0.86rem;
      }

      .docs {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 20px;
        margin-top: 30px;
        padding-top: 14px;
        border-top: 1px solid rgba(20, 20, 20, 0.18);
      }

      .doc {
        flex: 1 1 240px;
      }

      .doc h2 {
        margin-top: 0;
        text-align: left;
        text-transform: none;
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

        .masthead {
          grid-template-columns: 1fr;
        }

        .controls,
        .control-field,
        button {
          width: 100%;
        }
      }

      @media (prefers-color-scheme: dark) {
        :root {
          background: #121212;
          color: #f8fafc;
        }

        body {
          background: #121212;
        }

        .lede,
        label,
        .doc p,
        code {
          color: #d1d5db;
        }

        select,
        button {
          border-color: rgba(255, 255, 255, 0.18);
          background: rgba(17, 24, 39, 0.72);
          color: #f8fafc;
        }

        img,
        .docs {
          border-top-color: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.2);
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="masthead" aria-labelledby="title">
        <div>
          <h1 id="title">Ashatars</h1>
          <p class="lede">Deterministic SVG avatars for one seed. These examples use <code id="seed-value">${escapeText(seed)}</code>; choose a vibe or refresh the seed to update every local avatar URL together.</p>
        </div>
        <div class="controls">
          <div class="control-field">
            <label for="vibe">Vibe</label>
            <select id="vibe" name="vibe">${vibeOptions}</select>
          </div>
          <button id="refresh-seed" type="button">Refresh seed</button>
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
      const refresh = document.querySelector("#refresh-seed");
      const seedValue = document.querySelector("#seed-value");
      let currentSeed = ${JSON.stringify(seed)};

      const fallbackUuid = () => {
        const bytes = new Uint8Array(16);
        if (globalThis.crypto && crypto.getRandomValues) {
          crypto.getRandomValues(bytes);
        } else {
          for (let index = 0; index < bytes.length; index += 1) {
            bytes[index] = Math.floor(Math.random() * 256);
          }
        }
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
        return hex.slice(0, 4).join("") + "-" + hex.slice(4, 6).join("") + "-" + hex.slice(6, 8).join("") + "-" + hex.slice(8, 10).join("") + "-" + hex.slice(10, 16).join("");
      };

      const randomSeed = () => {
        if (globalThis.crypto && typeof crypto.randomUUID === "function") {
          return crypto.randomUUID();
        }
        return fallbackUuid();
      };

      const updateGallery = () => {
        document.querySelectorAll("img[data-seed][data-type]").forEach((img) => {
          const type = img.dataset.type;
          img.dataset.seed = currentSeed;
          const next = "/" + encodeURIComponent(currentSeed) + ".svg?type=" + encodeURIComponent(type) + "&vibe=" + encodeURIComponent(select.value);
          img.src = next;
          img.alt = type + " avatar for " + currentSeed;
          img.closest("a").href = next;
        });
        seedValue.textContent = currentSeed;
      };

      select.addEventListener("change", updateGallery);
      refresh.addEventListener("click", () => {
        currentSeed = randomSeed();
        updateGallery();
      });
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
