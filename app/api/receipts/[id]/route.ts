import { NextResponse } from "next/server";
import { getReceipt } from "@/lib/receipt-store";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const receipt = await getReceipt(id);
  if (!receipt) return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
  const { imageBlobUrl: omittedBlobUrl, imageFileName: omittedFileName, ...publicReceipt } = receipt;
  void omittedBlobUrl; void omittedFileName;
  return NextResponse.json({ ...publicReceipt, imageUrl: `/api/receipts/${id}/image` });
}
