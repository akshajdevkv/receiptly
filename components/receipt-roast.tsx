"use client";

import { useState } from "react";
import { Flame, LoaderCircle, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Roast = { title: string; lines: string[] };

export function ReceiptRoast({ receiptId }: { receiptId?: string }) {
  const [open, setOpen] = useState(false);
  const [roast, setRoast] = useState<Roast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateRoast() {
    if (!receiptId) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/receipts/${receiptId}/roast`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not roast this receipt.");
      setRoast(body);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not roast this receipt.");
    } finally { setLoading(false); }
  }

  function launch() {
    setOpen(true);
    if (!roast && !loading) void generateRoast();
  }

  return <>
    <button onClick={launch} disabled={!receiptId} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#203652] bg-white px-5 py-3.5 font-bold text-[#10213b] transition hover:border-[#ff704d] hover:text-[#c43d1c] disabled:opacity-50"><Flame size={19}/>Roast My Receipt</button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-[22px] border-[#263b57] bg-[#0b1729] p-0 text-white shadow-2xl">
        <DialogHeader className="border-b border-white/10 px-6 py-5 pr-14 text-left sm:px-8">
          <span className="font-mono text-xs font-bold uppercase tracking-[.16em] text-[#ff9b76]">receipt.exe / roast</span>
          <DialogTitle className="text-2xl text-white">Roast My Receipt</DialogTitle>
          <DialogDescription className="text-[#9fb0c8]">A friendly audit of your shopping decisions.</DialogDescription>
        </DialogHeader>
        <div className="min-h-64 p-6 font-mono sm:p-8">
          {loading ? <div className="flex min-h-48 items-center justify-center"><div className="text-center"><LoaderCircle size={24} className="mx-auto animate-spin text-[#ff8a66]"/><p className="mt-4 text-sm text-[#b8c5d6]">&gt; judging your financial decisions...</p></div></div> : error ? <div className="flex min-h-48 flex-col justify-center"><p className="text-sm text-[#ff9b90]">&gt; {error}</p><button onClick={() => void generateRoast()} className="mt-5 flex w-fit items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-bold hover:border-[#ff9b76]"><RotateCcw size={15}/>Try again</button></div> : roast ? <div><div className="flex items-center gap-2 text-[#ff9b76]"><Flame size={18}/><span className="text-sm font-bold uppercase tracking-[.14em]">{roast.title}</span></div><div className="mt-6 space-y-3 text-base leading-7 text-[#e1e7ef]">{roast.lines.slice(0,4).map((line,index)=><p key={`${line}-${index}`}>&gt; {line}</p>)}</div><button onClick={() => void generateRoast()} className="mt-8 flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-bold hover:border-[#ff9b76] hover:text-[#ffb29a]"><RotateCcw size={15}/>Roast Again</button></div> : null}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
