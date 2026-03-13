function normalizeProtocol(protocol: string | null | undefined) {
  if (!protocol) {
    return "http";
  }

  return protocol.replace(/:$/, "");
}

type RequestLike = {
  headers: Pick<Headers, "get">;
  nextUrl: {
    host: string;
    protocol: string;
  };
};

export function getRequestOrigin(request: RequestLike) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? request.nextUrl.host;
  const protocol = normalizeProtocol(request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol);

  return `${protocol}://${host}`;
}
