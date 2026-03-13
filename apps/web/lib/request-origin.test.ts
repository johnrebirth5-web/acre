import assert from "node:assert/strict";
import test from "node:test";
import { getRequestOrigin } from "./request-origin.ts";

test("request origin prefers reverse-proxy headers when present", () => {
  const request = {
    headers: new Headers({
      host: "127.0.0.1:3000",
      "x-forwarded-host": "office.acre.local",
      "x-forwarded-proto": "https"
    }),
    nextUrl: new URL("http://127.0.0.1:3000/login")
  };

  assert.equal(getRequestOrigin(request), "https://office.acre.local");
});

test("request origin falls back to request url host and protocol", () => {
  const request = {
    headers: new Headers(),
    nextUrl: new URL("http://45.55.247.137/login")
  };

  assert.equal(getRequestOrigin(request), "http://45.55.247.137");
});
