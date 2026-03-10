import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

function loadDatabaseEnvFromRepoRoot() {
  if (process.env.DATABASE_URL) {
    return;
  }

  const sourceDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(sourceDir, "../../..");
  const candidates = [resolve(repoRoot, ".env.local"), resolve(repoRoot, ".env")];

  for (const candidate of candidates) {
    if (!existsSync(candidate)) {
      continue;
    }

    const contents = readFileSync(candidate, "utf8");

    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");

      if (separatorIndex <= 0) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

loadDatabaseEnvFromRepoRoot();

const globalForPrisma = globalThis as typeof globalThis & {
  __acrePrisma?: PrismaClient;
};

const datasourceUrl = process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.__acrePrisma ??
  new PrismaClient(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : undefined);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__acrePrisma = prisma;
}

export function getPrismaClient() {
  return prisma;
}

export function assertDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for Prisma runtime.");
  }
}
