import { del, list, put } from "@vercel/blob";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredReceipt = {
  id: string;
  merchant: string;
  date: string;
  receiptNumber: string;
  currency: string;
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  total: number | null;
  paymentMethod: string;
  category: string;
  items: { name: string; quantity: number; price: number }[];
  imageType: string;
  imageBlobUrl?: string;
  imageFileName?: string;
  createdAt: number;
};

const localRoot = path.join(process.cwd(), ".data", "receipts");
const usesBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export function ensureReceiptStorage() {
  if (process.env.VERCEL && !usesBlob()) {
    throw new Error("Receipt storage is not configured. Connect a Vercel Blob store to this project, then redeploy.");
  }
}

function extension(file: File) {
  const known: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf",
  };
  return known[file.type] || "bin";
}

export async function saveReceipt(data: Omit<StoredReceipt, "imageType" | "imageBlobUrl" | "imageFileName">, file: File) {
  ensureReceiptStorage();
  const fileName = `original.${extension(file)}`;
  const receipt: StoredReceipt = { ...data, imageType: file.type, imageFileName: fileName };
  if (usesBlob()) {
    const image = await put(`receipts/${data.id}/${fileName}`, file, { access: "public", addRandomSuffix: false });
    receipt.imageBlobUrl = image.url;
    try {
      await put(`receipts/${data.id}/data.json`, JSON.stringify(receipt), { access: "public", addRandomSuffix: false, contentType: "application/json" });
    } catch (error) {
      await del(image.url);
      throw error;
    }
    return receipt;
  }
  const directory = path.join(localRoot, data.id);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), Buffer.from(await file.arrayBuffer()));
  await writeFile(path.join(directory, "data.json"), JSON.stringify(receipt));
  return receipt;
}

export async function getReceipt(id: string): Promise<StoredReceipt | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  ensureReceiptStorage();
  if (usesBlob()) {
    const result = await list({ prefix: `receipts/${id}/data.json`, limit: 1 });
    if (!result.blobs[0]) return null;
    const response = await fetch(result.blobs[0].url, { cache: "no-store" });
    return response.ok ? response.json() as Promise<StoredReceipt> : null;
  }
  try { return JSON.parse(await readFile(path.join(localRoot, id, "data.json"), "utf8")) as StoredReceipt; }
  catch { return null; }
}

export async function listReceipts(): Promise<StoredReceipt[]> {
  ensureReceiptStorage();
  if (usesBlob()) {
    const result = await list({ prefix: "receipts/", limit: 1000 });
    const metadata = result.blobs.filter((blob) => blob.pathname.endsWith("/data.json"));
    const receipts = await Promise.all(metadata.map(async (blob) => {
      const response = await fetch(blob.url, { cache: "no-store" });
      return response.ok ? response.json() as Promise<StoredReceipt> : null;
    }));
    return receipts.filter((receipt): receipt is StoredReceipt => Boolean(receipt)).sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
  }
  try {
    const entries = await readdir(localRoot, { withFileTypes: true });
    const receipts = await Promise.all(entries.filter((entry) => entry.isDirectory()).map((entry) => getReceipt(entry.name)));
    return receipts.filter((receipt): receipt is StoredReceipt => Boolean(receipt)).sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
  } catch { return []; }
}

export async function getLocalReceiptImage(receipt: StoredReceipt) {
  if (!receipt.imageFileName) return null;
  try { return await readFile(path.join(localRoot, receipt.id, receipt.imageFileName)); }
  catch { return null; }
}
