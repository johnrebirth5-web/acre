import type { NextRequest } from "next/server";

function normalizeProtocol(protocol: string | null | undefined) {
  if (!protocol) {
    return "http";
  }

  return protocol.replace(/:$/, "");
}

export function getRequestOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? request.nextUrl.host;
  const protocol = normalizeProtocol(request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol);

  return `${protocol}://${host}`;
}
