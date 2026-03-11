import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

type SaveStoredFileInput = {
  organizationId: string;
  transactionId: string;
  fileName: string;
  bytes: Uint8Array;
};

type SaveStoredTextInput = {
  organizationId: string;
  transactionId: string;
  fileName: string;
  content: string;
};

export type StoredDocumentFile = {
  storageKey: string;
  absolutePath: string;
  fileName: string;
  fileSizeBytes: number;
};

function getStorageRoot() {
  return process.env.ACRE_DOCUMENTS_STORAGE_DIR?.trim() || path.join(process.cwd(), ".local-storage", "documents");
}

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 120) || "file";
}

async function ensureTransactionDirectory(organizationId: string, transactionId: string) {
  const directory = path.join(getStorageRoot(), sanitizeSegment(organizationId), sanitizeSegment(transactionId));
  await mkdir(directory, { recursive: true });
  return directory;
}

export async function saveStoredFile(input: SaveStoredFileInput): Promise<StoredDocumentFile> {
  const directory = await ensureTransactionDirectory(input.organizationId, input.transactionId);
  const fileName = `${randomUUID()}-${sanitizeSegment(input.fileName)}`;
  const absolutePath = path.join(directory, fileName);

  await writeFile(absolutePath, Buffer.from(input.bytes));

  return {
    storageKey: absolutePath,
    absolutePath,
    fileName,
    fileSizeBytes: input.bytes.byteLength
  };
}

export async function saveStoredTextDocument(input: SaveStoredTextInput): Promise<StoredDocumentFile> {
  const bytes = Buffer.from(input.content, "utf8");
  return saveStoredFile({
    organizationId: input.organizationId,
    transactionId: input.transactionId,
    fileName: input.fileName,
    bytes
  });
}

export async function readStoredFile(storageKey: string) {
  const absolutePath = path.isAbsolute(storageKey) ? storageKey : path.join(getStorageRoot(), storageKey);
  const [fileBuffer, fileStat] = await Promise.all([readFile(absolutePath), stat(absolutePath)]);

  return {
    absolutePath,
    fileBuffer,
    fileSizeBytes: fileStat.size
  };
}

export async function deleteStoredFile(storageKey: string) {
  const absolutePath = path.isAbsolute(storageKey) ? storageKey : path.join(getStorageRoot(), storageKey);
  await rm(absolutePath, { force: true });
}
