import { NextResponse } from "next/server";
import { env } from "cloudflare:workers";

type ReceiptRow = {
  id: string; merchant: string; date: string; receiptNumber: string; currency: string;
  subtotal: number | null; tax: number | null; tip: number | null; total: number | null;
  paymentMethod: string; category: string; itemsJson: string; imageType: string; createdAt: number;
};

export async function GET() {
  if (!env.DB) return NextResponse.json({ error: "Receipt storage is unavailable." }, { status: 503 });
  const result = await env.DB.prepare(`SELECT id,merchant,purchase_date AS date,receipt_number AS receiptNumber,currency,subtotal_cents AS subtotal,tax_cents AS tax,tip_cents AS tip,total_cents AS total,payment_method AS paymentMethod,category,items_json AS itemsJson,image_type AS imageType,created_at AS createdAt FROM receipts ORDER BY created_at DESC LIMIT 50`).all<ReceiptRow>();
  return NextResponse.json(result.results.map((row) => ({
    ...row,
    subtotal: row.subtotal == null ? null : row.subtotal / 100,
    tax: row.tax == null ? null : row.tax / 100,
    tip: row.tip == null ? null : row.tip / 100,
    total: row.total == null ? null : row.total / 100,
    items: JSON.parse(row.itemsJson), itemsJson: undefined,
    imageUrl: `/api/receipts/${row.id}/image`,
  })));
}
