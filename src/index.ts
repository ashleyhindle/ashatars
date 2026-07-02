import {
  createAvatarSvg,
  DEFAULT_VIBE,
  SUPPORTED_AVATAR_TYPES,
  SUPPORTED_VIBES,
  VIBES,
} from "./avatar";
import { FAVICON_SVG } from "./favicon";

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
    return htmlResponse(renderHomepage(url.origin));
  }

  if (url.pathname === "/favicon.svg") {
    return new Response(FAVICON_SVG, {
      headers: SVG_HEADERS,
    });
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

export function renderHomepage(origin = "https://example.test"): string {
  const seed = "ashley@fuel.build";
  const vibeOptions = SUPPORTED_VIBES.map((vibe) => {
    const selected = vibe === DEFAULT_VIBE ? " selected" : "";
    return `<option value="${escapeAttribute(vibe)}"${selected}>${escapeText(VIBES[vibe].label)}</option>`;
  }).join("");
  const galleryRows = SUPPORTED_AVATAR_TYPES.map((type) => {
    const href = avatarUrl(origin, seed, { type, vibe: DEFAULT_VIBE });
    const label = typeLabel(type);

    return [
      `<article class="avatar-item" data-avatar-type="${escapeAttribute(type)}">`,
      `<a href="${escapeAttribute(href)}" aria-label="Open ${escapeAttribute(type)} avatar SVG">`,
      `<img class="avatar-thumb" src="${escapeAttribute(href)}" data-seed="${escapeAttribute(seed)}" data-type="${escapeAttribute(type)}" alt="${escapeAttribute(type)} avatar for ${escapeAttribute(seed)}" width="80" height="80"/>`,
      "</a>",
      `<div class="avatar-copy">`,
      `<h2>${escapeText(label)}</h2>`,
      `<a class="avatar-url" data-avatar-url href="${escapeAttribute(href)}">${escapeText(href)}</a>`,
      "</div>",
      "</article>",
    ].join("");
  }).join("");
  const typeChoices = SUPPORTED_AVATAR_TYPES.map((type) => {
    return [
      `<label class="type-choice">`,
      `<input type="checkbox" name="builder-type" value="${escapeAttribute(type)}"/>`,
      `<span>${escapeText(typeLabel(type))}</span>`,
      "</label>",
    ].join("");
  }).join("");
  const builderUrl = avatarUrl(origin, seed, {
    vibe: DEFAULT_VIBE,
  });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Ashatars SVG gallery</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
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
        background: #f8fafc;
      }

      main {
        width: min(1080px, calc(100% - 32px));
        margin: 0 auto;
        padding: 28px 0 44px;
      }

      .masthead {
        position: sticky;
        top: 0;
        z-index: 10;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 20px;
        align-items: center;
        margin: 0 -8px 18px;
        padding: 8px 8px 10px;
        border-bottom: 1px solid rgba(20, 20, 20, 0.14);
        background: rgba(248, 250, 252, 0.92);
        backdrop-filter: blur(12px);
      }

      h1 {
        margin: 0 0 8px;
        font-size: clamp(2rem, 5vw, 4rem);
        line-height: 1;
        letter-spacing: 0;
      }

      .controls {
        display: flex;
        gap: 8px;
        align-items: end;
        flex-wrap: wrap;
        justify-content: end;
      }

      .control-field {
        display: grid;
        gap: 6px;
        min-width: 156px;
      }

      .field-label {
        color: #374151;
        font-size: 0.82rem;
        font-weight: 700;
        text-transform: uppercase;
      }

      .select-wrap {
        position: relative;
        width: max-content;
      }

      .select-wrap::after {
        content: "";
        position: absolute;
        right: 14px;
        top: 50%;
        width: 8px;
        height: 8px;
        border-right: 2px solid currentColor;
        border-bottom: 2px solid currentColor;
        pointer-events: none;
        transform: translateY(-65%) rotate(45deg);
      }

      select,
      button,
      input[type="text"],
      textarea {
        min-height: 44px;
        border: 1px solid rgba(20, 20, 20, 0.24);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.84);
        color: #141414;
        padding: 0 12px;
        font: inherit;
      }

      select {
        appearance: none;
        width: auto;
        min-width: 148px;
        padding-right: 40px;
      }

      button {
        cursor: pointer;
        font-weight: 700;
      }

      input[type="text"],
      textarea {
        width: 100%;
      }

      textarea {
        min-height: 72px;
        padding: 10px 12px;
        resize: vertical;
        overflow-wrap: anywhere;
      }

      button:focus-visible,
      select:focus-visible,
      input:focus-visible,
      textarea:focus-visible,
      a:focus-visible {
        outline: 3px solid rgba(37, 99, 235, 0.42);
        outline-offset: 3px;
      }

      .gallery {
        display: grid;
        gap: 0;
        border-top: 1px solid rgba(20, 20, 20, 0.16);
      }

      .avatar-item {
        min-width: 0;
        display: grid;
        grid-template-columns: 84px minmax(0, 1fr);
        gap: 14px;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid rgba(20, 20, 20, 0.12);
      }

      .avatar-item a {
        display: inline-flex;
        border-radius: 999px;
      }

      .avatar-thumb {
        display: block;
        width: 80px;
        height: 80px;
        aspect-ratio: 1;
        border-radius: 50%;
        overflow: hidden;
        object-fit: cover;
        border: 1px solid rgba(20, 20, 20, 0.16);
        box-shadow: 0 8px 18px rgba(20, 20, 20, 0.12);
      }

      .avatar-copy {
        min-width: 0;
      }

      h2 {
        margin: 0 0 8px;
        font-size: 0.96rem;
        line-height: 1.25;
        text-transform: capitalize;
        overflow-wrap: anywhere;
      }

      .avatar-url {
        display: block;
        width: fit-content;
        max-width: 100%;
        color: #334155;
        font-size: 0.86rem;
        line-height: 1.4;
        overflow-wrap: anywhere;
        border-radius: 6px;
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
        grid-template-columns: minmax(0, 0.9fr) minmax(320px, 1.1fr);
        gap: 28px;
        margin-top: 34px;
        padding-top: 22px;
        border-top: 1px solid rgba(20, 20, 20, 0.18);
      }

      .doc-copy {
        display: grid;
        align-content: start;
        gap: 16px;
      }

      .doc-copy h2,
      .builder h2 {
        margin-top: 0;
        text-align: left;
        text-transform: none;
      }

      .doc-copy p {
        color: #374151;
        line-height: 1.55;
      }

      .builder {
        display: grid;
        gap: 14px;
        padding: 18px;
        border: 1px solid rgba(20, 20, 20, 0.16);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.62);
      }

      .builder-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: end;
      }

      .type-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 8px 12px;
      }

      .type-choice {
        display: flex;
        gap: 8px;
        align-items: center;
        min-width: 0;
        color: #1f2937;
        font-size: 0.9rem;
        line-height: 1.35;
      }

      .type-choice input {
        width: 16px;
        height: 16px;
        flex: 0 0 auto;
      }

      .builder-output {
        display: grid;
        gap: 8px;
      }

      .output-actions {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
      }

      .output-actions a {
        color: #1d4ed8;
        overflow-wrap: anywhere;
      }

      @media (max-width: 720px) {
        main {
          width: min(100% - 24px, 1180px);
          padding-top: 20px;
        }

        .masthead {
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }

        .controls,
        .control-field,
        .select-wrap,
        select,
        button {
          width: 100%;
        }

        .controls {
          justify-content: stretch;
        }

        .avatar-item {
          grid-template-columns: 80px minmax(0, 1fr);
          gap: 12px;
        }

        .avatar-thumb {
          width: 76px;
          height: 76px;
        }

        .docs,
        .builder-grid {
          grid-template-columns: 1fr;
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

        .field-label,
        .doc-copy p,
        .type-choice,
        .avatar-url,
        code {
          color: #d1d5db;
        }

        select,
        button,
        input[type="text"],
        textarea {
          border-color: rgba(255, 255, 255, 0.18);
          background: rgba(17, 24, 39, 0.72);
          color: #f8fafc;
        }

        .avatar-thumb,
        .docs,
        .gallery,
        .avatar-item,
        .builder {
          border-top-color: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .masthead {
          border-bottom-color: rgba(255, 255, 255, 0.18);
          background: rgba(18, 18, 18, 0.9);
        }

        .builder {
          background: rgba(15, 23, 42, 0.48);
        }

        .output-actions a {
          color: #93c5fd;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="masthead" aria-labelledby="title">
        <div>
          <h1 id="title">Ashatars</h1>
          <p class="current-seed"><span class="field-label">Seed</span> <code id="seed-value">${escapeText(seed)}</code></p>
        </div>
        <div class="controls">
          <div class="control-field">
            <label class="field-label" for="vibe">Vibe</label>
            <span class="select-wrap"><select id="vibe" name="vibe">${vibeOptions}</select></span>
          </div>
          <button id="refresh-seed" type="button">Refresh seed</button>
        </div>
      </section>
      <section class="gallery" aria-label="Avatar type gallery">${galleryRows}</section>
      <section class="docs" aria-label="Route documentation">
        <div class="doc-copy">
          <section>
            <h2>Route</h2>
            <p><code>/:seed.svg</code> returns a cacheable SVG avatar for any email, UUID, or string seed.</p>
          </section>
          <section>
            <h2>Type selection</h2>
            <p>Use <code>type=dots</code> for one generator, or <code>types=dots,lines,wave</code> to let the API choose one supported type deterministically.</p>
          </section>
          <section>
            <h2>Vibes</h2>
            <p><code>vibe</code> changes the shared background treatment while preserving stable geometric marks.</p>
          </section>
        </div>
        <section class="builder" aria-labelledby="builder-title">
          <h2 id="builder-title">URL builder</h2>
          <div class="builder-grid">
            <div class="control-field">
              <label class="field-label" for="builder-seed">Seed</label>
              <input id="builder-seed" type="text" value="${escapeAttribute(seed)}"/>
            </div>
            <div class="control-field">
              <label class="field-label" for="builder-vibe">Vibe</label>
              <span class="select-wrap"><select id="builder-vibe">${vibeOptions}</select></span>
            </div>
          </div>
          <div class="control-field">
            <span class="field-label">Types</span>
            <div class="type-list">${typeChoices}</div>
          </div>
          <div class="builder-output">
            <label class="field-label" for="builder-url">Generated URL</label>
            <textarea id="builder-url" readonly>${escapeText(builderUrl)}</textarea>
            <div class="output-actions">
              <button id="copy-url" type="button">Copy URL</button>
              <a id="builder-link" href="${escapeAttribute(builderUrl)}">Open generated SVG</a>
            </div>
          </div>
        </section>
      </section>
    </main>
    <script>
      const select = document.querySelector("#vibe");
      const refresh = document.querySelector("#refresh-seed");
      const seedValue = document.querySelector("#seed-value");
      const builderSeed = document.querySelector("#builder-seed");
      const builderVibe = document.querySelector("#builder-vibe");
      const builderTypes = Array.from(document.querySelectorAll('input[name="builder-type"]'));
      const builderUrl = document.querySelector("#builder-url");
      const builderLink = document.querySelector("#builder-link");
      const copyUrl = document.querySelector("#copy-url");
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

      const buildPath = (seed, options) => {
        const params = [];
        const types = options.types || [];
        const allTypes = ${JSON.stringify(SUPPORTED_AVATAR_TYPES)};
        const selectedAllTypes = types.length === allTypes.length && allTypes.every((type) => types.includes(type));
        if (options.type) {
          params.push("type=" + encodeURIComponent(options.type));
        } else if (types.length === 1) {
          params.push("type=" + encodeURIComponent(types[0]));
        } else if (types.length > 1 && !selectedAllTypes) {
          params.push("types=" + types.map((type) => encodeURIComponent(type)).join(","));
        }
        if (options.vibe) {
          params.push("vibe=" + encodeURIComponent(options.vibe));
        }
        return "/" + encodeURIComponent(seed) + ".svg" + (params.length > 0 ? "?" + params.join("&") : "");
      };

      const buildUrl = (seed, options) => window.location.origin + buildPath(seed, options);

      const updateGallery = () => {
        document.querySelectorAll("img[data-seed][data-type]").forEach((img) => {
          const type = img.dataset.type;
          img.dataset.seed = currentSeed;
          const next = buildUrl(currentSeed, { type, vibe: select.value });
          img.src = next;
          img.alt = type + " avatar for " + currentSeed;
          const row = img.closest("[data-avatar-type]");
          img.closest("a").href = next;
          const urlLink = row.querySelector("[data-avatar-url]");
          urlLink.href = next;
          urlLink.textContent = next;
        });
        seedValue.textContent = currentSeed;
      };

      const updateBuilder = () => {
        const seed = builderSeed.value.trim() || currentSeed;
        const checkedTypes = builderTypes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);
        const next = buildUrl(seed, { types: checkedTypes, vibe: builderVibe.value });
        builderUrl.value = next;
        builderLink.href = next;
      };

      select.addEventListener("change", () => {
        updateGallery();
        builderVibe.value = select.value;
        updateBuilder();
      });
      refresh.addEventListener("click", () => {
        currentSeed = randomSeed();
        builderSeed.value = currentSeed;
        updateGallery();
        updateBuilder();
      });
      builderSeed.addEventListener("input", updateBuilder);
      builderVibe.addEventListener("change", updateBuilder);
      builderTypes.forEach((checkbox) => checkbox.addEventListener("change", updateBuilder));
      copyUrl.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(builderUrl.value);
          copyUrl.textContent = "Copied";
          setTimeout(() => {
            copyUrl.textContent = "Copy URL";
          }, 1200);
        } catch {
          builderUrl.focus();
          builderUrl.select();
        }
      });
    </script>
  </body>
</html>`;
}

export function avatarPath(
  seed: string,
  options: {
    readonly type?: string;
    readonly types?: readonly string[];
    readonly vibe?: string;
  } = {},
): string {
  const params: string[] = [];
  if (options.type) {
    params.push(`type=${encodeURIComponent(options.type)}`);
  } else if (options.types?.length === 1) {
    params.push(`type=${encodeURIComponent(options.types[0])}`);
  } else if (options.types && options.types.length > 1 && !hasAllSupportedTypes(options.types)) {
    params.push(`types=${options.types.map((type) => encodeURIComponent(type)).join(",")}`);
  }
  if (options.vibe) {
    params.push(`vibe=${encodeURIComponent(options.vibe)}`);
  }

  return `/${encodeURIComponent(seed)}.svg${params.length > 0 ? `?${params.join("&")}` : ""}`;
}

function avatarUrl(origin: string, seed: string, options: Parameters<typeof avatarPath>[1]): string {
  return `${origin}${avatarPath(seed, options)}`;
}

function hasAllSupportedTypes(types: readonly string[]): boolean {
  const selected = new Set(types);
  return selected.size === SUPPORTED_AVATAR_TYPES.length && SUPPORTED_AVATAR_TYPES.every((type) => selected.has(type));
}

function typeLabel(type: string): string {
  return type.replace(/_/g, " ").replace(/-/g, " ");
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
