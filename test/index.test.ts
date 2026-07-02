import { describe, expect, test } from "bun:test";
import worker, { handleRequest } from "../src/index";

describe("worker scaffold", () => {
  test("returns a minimal homepage response", async () => {
    const response = await handleRequest(new Request("https://example.test/"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await response.text()).toContain("Ashatars");
  });

  test("exports a Cloudflare Worker fetch handler", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/"),
      {},
      {} as ExecutionContext,
    );

    expect(response.status).toBe(200);
  });

  test("does not add the deferred /avatar route", async () => {
    const response = await handleRequest(new Request("https://example.test/avatar/demo.svg"));

    expect(response.status).toBe(404);
  });
});
