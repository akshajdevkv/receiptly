"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Check, Eye, RotateCcw, Tag, X } from "lucide-react";
import { buildMissingOptions, buildPriceOptions, pickDifferentItem, shuffle, type GameItem } from "@/lib/receipt-games";

type ReceiptGameData = { merchant: string; currency: string; items: GameItem[] };
type Game = "menu" | "missing" | "price";

const formatMoney = (value: number, currency: string) => {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(value); }
  catch { return `${value.toFixed(2)} ${currency}`; }
};

export function ReceiptGameExperience({ receipt, allReceipts, onBack }: { receipt: ReceiptGameData; allReceipts: ReceiptGameData[]; onBack: () => void }) {
  const [game, setGame] = useState<Game>("menu");
  const eligibleItems = receipt.items.filter((item) => item.name.trim());
  const pricedItems = eligibleItems.filter((item) => Number.isFinite(item.price) && item.price >= 0);
  return <div className="min-h-[560px] bg-[#0b1729] p-5 text-white sm:p-8">
    <button onClick={game === "menu" ? onBack : () => setGame("menu")} className="mb-6 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-[#9fb0c8] hover:bg-white/8 hover:text-white"><ArrowLeft size={16}/>{game === "menu" ? "Back to receipt" : "Choose another game"}</button>
    {game === "menu" ? <GameMenu merchant={receipt.merchant} canPlayMissing={eligibleItems.length > 1} canPlayPrice={pricedItems.length > 0} onSelect={setGame}/> : game === "missing" ? <WhatsMissing receipt={receipt} allReceipts={allReceipts}/> : <PriceGuess receipt={receipt}/>} 
  </div>;
}

function GameMenu({merchant,canPlayMissing,canPlayPrice,onSelect}:{merchant:string;canPlayMissing:boolean;canPlayPrice:boolean;onSelect:(game:Game)=>void}){
  return <div className="mx-auto max-w-2xl"><span className="font-mono text-xs font-bold uppercase tracking-[.16em] text-[#75a7ff]">receipt.exe / games</span><h2 className="mt-3 text-3xl font-bold tracking-tight">Play with {merchant||"this receipt"}</h2><p className="mt-2 text-[#9fb0c8]">Two quick memory games, built entirely from your saved receipt data.</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><GameCard icon={<Eye/>} title="What’s Missing?" description="Memorize the items, then spot the one that disappeared." disabled={!canPlayMissing} onClick={()=>onSelect("missing")}/><GameCard icon={<Tag/>} title="Price Guess" description="Can you remember what each item actually cost?" disabled={!canPlayPrice} onClick={()=>onSelect("price")}/></div></div>
}

function GameCard({icon,title,description,disabled,onClick}:{icon:React.ReactNode;title:string;description:string;disabled:boolean;onClick:()=>void}){return <button onClick={onClick} disabled={disabled} className="group rounded-2xl border border-white/12 bg-white/6 p-5 text-left transition hover:-translate-y-1 hover:border-[#75a7ff] hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"><span className="grid size-11 place-items-center rounded-xl bg-[#155eef] text-white">{icon}</span><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#9fb0c8]">{disabled?"Not enough eligible items on this receipt.":description}</p></button>}

function WhatsMissing({receipt,allReceipts}:{receipt:ReceiptGameData;allReceipts:ReceiptGameData[]}){
  const items=receipt.items.filter(item=>item.name.trim());const[difficulty,setDifficulty]=useState<"memorize"|"guess"|"result">("memorize");const[missing,setMissing]=useState<GameItem|null>(null);const[previous,setPrevious]=useState<string>();const[options,setOptions]=useState<string[]>([]);const[answer,setAnswer]=useState<string>();
  const distractors=useMemo(()=>allReceipts.flatMap(saved=>saved.items.map(item=>item.name)),[allReceipts]);
  function begin(){const picked=pickDifferentItem(items,previous);if(!picked)return;setMissing(picked);setPrevious(picked.name);setOptions(buildMissingOptions(picked.name,shuffle([...distractors,...items.map(item=>item.name)])));setAnswer(undefined);setDifficulty("guess")}
  function choose(value:string){setAnswer(value);setDifficulty("result")}
  return <div className="mx-auto max-w-2xl"><div className="flex items-center gap-3"><Eye className="text-[#75a7ff]"/><div><span className="font-mono text-xs uppercase tracking-wider text-[#75a7ff]">memory mode</span><h2 className="text-2xl font-bold">What’s Missing?</h2></div></div>{difficulty==="memorize"?<><p className="mt-6 text-[#c7d2e0]">Memorize every item. Nothing will disappear until you’re ready.</p><ItemGrid items={items}/><button onClick={begin} className="mt-6 w-full rounded-xl bg-[#155eef] px-5 py-3.5 font-bold hover:bg-[#2b6df2]">I’m Ready</button></>:<><p className="mt-6 text-[#c7d2e0]">{difficulty==="guess"?"One item disappeared. Which one was it?":answer===missing?.name?"Correct — sharp memory!":"Not quite. Here’s what disappeared:"}</p><ItemGrid items={items.filter((item,index)=>!(item.name===missing?.name&&index===items.findIndex(candidate=>candidate.name===missing?.name)))}/>{difficulty==="guess"?<div className="mt-6 grid gap-3 sm:grid-cols-2">{options.map(option=><button key={option} onClick={()=>choose(option)} className="rounded-xl border border-white/14 bg-white/7 px-4 py-3 text-left font-semibold hover:border-[#75a7ff] hover:bg-white/12">{option}</button>)}</div>:<Result correct={answer===missing?.name} text={missing?.name||"Unknown item"} action="Next Round" onNext={()=>setDifficulty("memorize")}/>}</>}</div>
}

function PriceGuess({receipt}:{receipt:ReceiptGameData}){const items=receipt.items.filter(item=>item.name.trim()&&Number.isFinite(item.price)&&item.price>=0);const[current,setCurrent]=useState<GameItem|null>(()=>pickDifferentItem(items));const[previous,setPrevious]=useState(current?.name);const[answer,setAnswer]=useState<number>();const options=useMemo(()=>current?buildPriceOptions(current.price,receipt.currency):[],[current,receipt.currency]);function next(){const picked=pickDifferentItem(items,previous);setCurrent(picked);setPrevious(picked?.name);setAnswer(undefined)}return <div className="mx-auto max-w-2xl"><div className="flex items-center gap-3"><Tag className="text-[#75a7ff]"/><div><span className="font-mono text-xs uppercase tracking-wider text-[#75a7ff]">price mode</span><h2 className="text-2xl font-bold">Price Guess</h2></div></div><div className="mt-10 rounded-2xl border border-white/12 bg-white/6 p-7 text-center"><p className="text-sm text-[#9fb0c8]">How much did this cost?</p><h3 className="mt-3 text-2xl font-bold">{current?.name}</h3>{current&&current.quantity>1&&<p className="mt-2 text-sm text-[#9fb0c8]">Quantity: {current.quantity}</p>}</div>{answer===undefined?<div className="mt-6 grid grid-cols-2 gap-3">{options.map(option=><button key={option} onClick={()=>setAnswer(option)} className="rounded-xl border border-white/14 bg-white/7 px-4 py-4 font-bold hover:border-[#75a7ff] hover:bg-white/12">{formatMoney(option,receipt.currency)}</button>)}</div>:<Result correct={answer===current?.price} text={current?formatMoney(current.price,receipt.currency):"—"} action="Next Question" onNext={next}/>}</div>}

function ItemGrid({items}:{items:GameItem[]}){return <div className="mt-5 grid gap-2 sm:grid-cols-2">{items.map((item,index)=><div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"><span className="font-semibold">{item.name}</span><span className="text-xs text-[#9fb0c8]">×{item.quantity||1}</span></div>)}</div>}
function Result({correct,text,action,onNext}:{correct:boolean;text:string;action:string;onNext:()=>void}){return <div className={`mt-6 rounded-2xl border p-5 ${correct?"border-[#51c99a]/40 bg-[#17805c]/18":"border-[#ff8e86]/35 bg-[#b42318]/16"}`}><div className="flex items-center gap-3">{correct?<Check className="text-[#63d3aa]"/>:<X className="text-[#ff8e86]"/>}<div><p className="font-bold">{correct?"Correct!":"Good try"}</p><p className="mt-1 text-sm text-[#c7d2e0]">Answer: <strong className="text-white">{text}</strong></p></div></div><button onClick={onNext} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-[#10213b] hover:bg-[#e8eef7]"><RotateCcw size={16}/>{action}</button></div>}
