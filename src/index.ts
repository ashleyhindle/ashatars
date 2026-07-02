export interface Env {}

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
    return textResponse("Ashatars SVG avatar service\n");
  }

  if (/^\/[^/]+\.svg$/.test(url.pathname)) {
    return textResponse("SVG avatar generation is not implemented in this slice.\n", {
      status: 501,
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
