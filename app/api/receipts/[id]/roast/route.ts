import { NextResponse } from "next/server";
import { env } from "cloudflare:workers";

type ReceiptRow = { itemsJson: string; total: number | null; currency: string };

const responseSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING", description: "A funny 2-4 word nickname for this receipt." },
    lines: { type: "ARRAY", items: { type: "STRING" }, minItems: 2, maxItems: 4 },
  },
  required: ["title", "lines"],
};

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ error: "Gemini is not configured." }, { status: 503 });
    if (!env.DB) return NextResponse.json({ error: "Receipt storage is unavailable." }, { status: 503 });
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
    const receipt = await env.DB.prepare("SELECT items_json AS itemsJson, total_cents AS total, currency FROM receipts WHERE id = ?").bind(id).first<ReceiptRow>();
    if (!receipt) return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
    const items = JSON.parse(receipt.itemsJson) as { name: string; quantity: number; price: number }[];
    const safeData = { items: items.map(({ name, quantity, price }) => ({ name, quantity, price })), total: receipt.total == null ? null : receipt.total / 100, currency: receipt.currency };
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Write a playful, sarcastic roast of this receipt using ONLY its item names, quantities, prices, and total. Return 2-4 short lines plus a funny 2-4 word title. Vary the joke each time. Never infer or insult body, health, income, identity, intelligence, relationships, addiction, or personal circumstances. Do not make financial-hardship claims. Keep it friendly and suitable for a general audience. Receipt data: ${JSON.stringify(safeData)}` }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema, temperature: 1, thinkingConfig: { thinkingLevel: "minimal" } },
      }),
    });
    const result = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[]; error?: { message?: string } };
    if (!response.ok) throw new Error(result.error?.message || "Gemini could not roast this receipt.");
    const text = result.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
    if (!text) throw new Error("No roast was returned. Try again.");
    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error("Receipt roast failed", error);
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json({ error: timedOut ? "The roast took too long. Try again." : error instanceof Error ? error.message : "Could not roast this receipt." }, { status: timedOut ? 504 : 500 });
  }
}
