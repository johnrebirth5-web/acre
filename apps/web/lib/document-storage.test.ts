import assert from "node:assert/strict";
import { mkdtemp, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { constants as fsConstants } from "node:fs";
import {
  deleteStoredFile,
  getDocumentStorageRoot,
  readStoredFile,
  saveStoredTextDocument
} from "./document-storage.ts";

async function withStorageEnv(run: (storageRoot: string) => Promise<void>) {
  const previousRoot = process.env.ACRE_DOCUMENTS_STORAGE_DIR;
  const storageRoot = await mkdtemp(path.join(tmpdir(), "acre-documents-"));
  process.env.ACRE_DOCUMENTS_STORAGE_DIR = storageRoot;

  try {
    await run(storageRoot);
  } finally {
    if (previousRoot === undefined) {
      delete process.env.ACRE_DOCUMENTS_STORAGE_DIR;
    } else {
      process.env.ACRE_DOCUMENTS_STORAGE_DIR = previousRoot;
    }
  }
}

test("document storage uses the configured absolute root and relative storage keys", async () => {
  await withStorageEnv(async (storageRoot) => {
    assert.equal(getDocumentStorageRoot(), storageRoot);

    const saved = await saveStoredTextDocument({
      organizationId: "org-1",
      transactionId: "tx-1",
      fileName: "Closing Statement.pdf",
      content: "hello world"
    });

    assert.equal(path.isAbsolute(saved.storageKey), false);
    assert.equal(saved.absolutePath.startsWith(storageRoot), true);

    const file = await readStoredFile(saved.storageKey);
    assert.equal(file.absolutePath, saved.absolutePath);
    assert.equal(file.fileBuffer.toString("utf8"), "hello world");

    await deleteStoredFile(saved.storageKey);
    await assert.rejects(() => access(saved.absolutePath, fsConstants.F_OK));
  });
});
