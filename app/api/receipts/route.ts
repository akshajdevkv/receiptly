import { NextResponse } from "next/server";
import { listReceipts } from "@/lib/receipt-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const receipts = await listReceipts();
    return NextResponse.json(receipts.map(({ imageBlobUrl: _, imageFileName: __, ...receipt }) => ({ ...receipt, imageUrl: `/api/receipts/${receipt.id}/image` })));
  } catch (error) {
    console.error("Could not list receipts", error);
    return NextResponse.json({ error: "Receipt storage is unavailable." }, { status: 503 });
  }
}
