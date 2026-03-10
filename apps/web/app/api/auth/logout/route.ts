import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, getSessionCookieSettings } from "../../../../lib/auth-session";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);

  response.cookies.set(getSessionCookieName(), "", {
    ...getSessionCookieSettings(),
    maxAge: 0
  });

  return response;
}
