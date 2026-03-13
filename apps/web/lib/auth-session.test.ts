import assert from "node:assert/strict";
import test from "node:test";
import {
  getSessionCookieOptions,
  getSessionSecret,
  shouldShowSeededUsers,
  shouldUseSecureCookies
} from "./auth-session-config.ts";

function withEnv(
  nextEnv: Partial<Record<"NODE_ENV" | "ACRE_SESSION_SECRET" | "ACRE_SECURE_COOKIES", string | undefined>>,
  run: () => void
) {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    ACRE_SESSION_SECRET: process.env.ACRE_SESSION_SECRET,
    ACRE_SECURE_COOKIES: process.env.ACRE_SECURE_COOKIES
  };

  for (const [key, value] of Object.entries(nextEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("secure cookie behavior stays explicit and proxy-safe", () => {
  withEnv({ NODE_ENV: "production", ACRE_SECURE_COOKIES: undefined }, () => {
    assert.equal(shouldUseSecureCookies(), true);
    assert.equal(getSessionCookieOptions().secure, true);
  });

  withEnv({ NODE_ENV: "production", ACRE_SECURE_COOKIES: "false" }, () => {
    assert.equal(shouldUseSecureCookies(), false);
    assert.equal(getSessionCookieOptions().secure, false);
  });

  withEnv({ NODE_ENV: "development", ACRE_SECURE_COOKIES: "true" }, () => {
    assert.equal(shouldUseSecureCookies(), true);
    assert.equal(getSessionCookieOptions().secure, true);
  });
});

test("production session creation requires an explicit secret", () => {
  withEnv({ NODE_ENV: "production", ACRE_SESSION_SECRET: undefined }, () => {
    assert.throws(() => getSessionSecret(), /ACRE_SESSION_SECRET is required in production/);
  });

  withEnv({ NODE_ENV: "production", ACRE_SESSION_SECRET: "test-secret" }, () => {
    assert.equal(getSessionSecret(), "test-secret");
  });
});

test("seeded-user directory is hidden in production", () => {
  withEnv({ NODE_ENV: "development" }, () => {
    assert.equal(shouldShowSeededUsers(), true);
  });

  withEnv({ NODE_ENV: "production" }, () => {
    assert.equal(shouldShowSeededUsers(), false);
  });
});
