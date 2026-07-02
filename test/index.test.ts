import { describe, expect, test } from "bun:test";
import worker, { handleRequest } from "../src/index";
import { SUPPORTED_AVATAR_TYPES, SUPPORTED_VIBES } from "../src/avatar";

describe("worker routes", () => {
  test("returns the gallery homepage", async () => {
    const response = await handleRequest(new Request("https://example.test/"));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(body).toContain("<h1");
    expect(body).toContain("Ashatars");
    expect(body).toContain('id="vibe"');
    expect(body).toContain('id="refresh-seed"');
    expect(body).toContain('id="seed-value"');
    expect(body).toContain('class="avatar-thumb"');
    expect(body).toContain("border-radius: 50%");
    expect(body).toContain("crypto.randomUUID");
    expect(body).toContain("fallbackUuid");
    for (const type of SUPPORTED_AVATAR_TYPES) {
      expect(body).toContain(`data-avatar-type="${type}"`);
      expect(body).toContain(`/ashley%40fuel.build.svg?type=${type}&amp;vibe=daybreak`);
    }
    for (const vibe of SUPPORTED_VIBES) {
      expect(body).toContain(`value="${vibe}"`);
    }
  });

  test("exports a Cloudflare Worker fetch handler", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/"),
      {},
      {} as ExecutionContext,
    );

    expect(response.status).toBe(200);
  });

  test("returns SVG avatars with immutable cache and CORS headers", async () => {
    const response = await handleRequest(
      new Request("https://example.test/ashley@fuel.build.svg?type=dots&vibe=ocean"),
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/svg+xml; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(body).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(body).toContain('viewBox="0 0 512 512"');
  });

  test("returns byte-stable avatar bodies across repeated route requests", async () => {
    const url = "https://example.test/7db79f08-6b58-434d-a58d-3309b9eb0975.svg?types=dots,dots&vibe=daybreak";
    const first = await handleRequest(new Request(url)).text();
    const second = await handleRequest(new Request(url)).text();

    expect(first).toBe(second);
  });

  test("supports documented type-list selection forms deterministically", async () => {
    const commaUrl = "https://example.test/ashley@fuel.build.svg?types=dots,lines,wave&vibe=ocean";
    const repeatedUrl = "https://example.test/ashley@fuel.build.svg?type=dots&type=lines&type=wave&vibe=ocean";
    const commaFirst = await handleRequest(new Request(commaUrl)).text();
    const commaSecond = await handleRequest(new Request(commaUrl)).text();
    const repeated = await handleRequest(new Request(repeatedUrl)).text();

    expect(commaFirst).toBe(commaSecond);
    expect(repeated).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
  });

  test("rejects invalid type and vibe params", async () => {
    const invalidType = await handleRequest(
      new Request("https://example.test/ashley@fuel.build.svg?type=not-a-type"),
    );
    const invalidTypes = await handleRequest(
      new Request("https://example.test/ashley@fuel.build.svg?types=dots,not-a-type"),
    );
    const invalidVibe = await handleRequest(
      new Request("https://example.test/ashley@fuel.build.svg?vibe=nope"),
    );

    expect(invalidType.status).toBe(400);
    expect(await invalidType.text()).toContain("Unsupported avatar type");
    expect(invalidTypes.status).toBe(400);
    expect(await invalidTypes.text()).toContain("Unsupported avatar type");
    expect(invalidVibe.status).toBe(400);
    expect(await invalidVibe.text()).toContain("Unsupported avatar vibe");
  });

  test("does not add the deferred /avatar route", async () => {
    const response = await handleRequest(new Request("https://example.test/avatar/demo.svg"));

    expect(response.status).toBe(404);
  });

  test("README avatar examples match implemented routes", async () => {
    const readme = await Bun.file("README.md").text();
    const examples = [
      "/ashley@fuel.build.svg?type=dots&vibe=ocean",
      "/7db79f08-6b58-434d-a58d-3309b9eb0975.svg?types=dots,lines,wave&vibe=daybreak",
    ];

    for (const path of examples) {
      expect(readme).toContain(path);
      const response = await handleRequest(new Request(`https://example.test${path}`));

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/svg+xml; charset=utf-8");
    }
  });
});
