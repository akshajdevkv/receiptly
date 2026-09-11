import { NextResponse } from "next/server";
import { env } from "cloudflare:workers";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!env.DB) return NextResponse.json({ error: "Receipt storage is unavailable." }, { status: 503 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "Receipt not found." }, { status: 404 });

  const row = await env.DB.prepare(`
    SELECT id, merchant, purchase_date AS date, receipt_number AS receiptNumber,
      currency, subtotal_cents AS subtotal, tax_cents AS tax, tip_cents AS tip,
      total_cents AS total, payment_method AS paymentMethod, category,
      items_json AS itemsJson, image_type AS imageType, created_at AS createdAt
    FROM receipts WHERE id = ?
  `).bind(id).first<Record<string, unknown>>();

  if (!row) return NextResponse.json({ error: "Receipt not found." }, { status: 404 });

  return NextResponse.json({
    ...row,
    subtotal: row.subtotal == null ? null : Number(row.subtotal) / 100,
    tax: row.tax == null ? null : Number(row.tax) / 100,
    tip: row.tip == null ? null : Number(row.tip) / 100,
    total: row.total == null ? null : Number(row.total) / 100,
    items: JSON.parse(String(row.itemsJson)),
    itemsJson: undefined,
    imageUrl: `/api/receipts/${id}/image`,
  });
}
