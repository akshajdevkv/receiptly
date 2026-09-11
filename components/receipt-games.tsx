"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronUp, Eye, Gavel, ListRestart, RotateCcw, Scale, Tag, X } from "lucide-react";
import { buildMissingOptions, buildPriceOptions, pickDifferentItem, shuffle, type GameItem } from "@/lib/receipt-games";

type ReceiptGameData = { merchant: string; currency: string; total?: number | null; items: GameItem[] };
type Game = "menu" | "missing" | "price" | "rebuild" | "courtroom";

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
    {game === "menu" ? <GameMenu merchant={receipt.merchant} canPlayMissing={eligibleItems.length > 1} canPlayPrice={pricedItems.length > 0} canPlayRebuild={eligibleItems.length > 1} canPlayCourtroom={pricedItems.length > 0} onSelect={setGame}/> : game === "missing" ? <WhatsMissing receipt={receipt} allReceipts={allReceipts}/> : game === "price" ? <PriceGuess receipt={receipt}/> : game === "rebuild" ? <RebuildReceipt receipt={receipt}/> : <PurchaseCourtroom receipt={receipt}/>}
  </div>;
}

function GameMenu({merchant,canPlayMissing,canPlayPrice,canPlayRebuild,canPlayCourtroom,onSelect}:{merchant:string;canPlayMissing:boolean;canPlayPrice:boolean;canPlayRebuild:boolean;canPlayCourtroom:boolean;onSelect:(game:Game)=>void}){
  return <div className="mx-auto max-w-3xl"><span className="font-mono text-xs font-bold uppercase tracking-[.16em] text-[#75a7ff]">receipt.exe / games</span><h2 className="mt-3 text-3xl font-bold tracking-tight">Play with {merchant||"this receipt"}</h2><p className="mt-2 text-[#9fb0c8]">Four quick games, built entirely from your saved receipt data.</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><GameCard icon={<Eye/>} title="What’s Missing?" description="Memorize the items, then spot the one that disappeared." disabled={!canPlayMissing} onClick={()=>onSelect("missing")}/><GameCard icon={<Tag/>} title="Price Guess" description="Can you remember what each item actually cost?" disabled={!canPlayPrice} onClick={()=>onSelect("price")}/><GameCard icon={<ListRestart/>} title="Rebuild the Receipt" description="Put every item back in its original receipt order." disabled={!canPlayRebuild} onClick={()=>onSelect("rebuild")}/><GameCard icon={<Gavel/>} title="Purchase Courtroom" description="Defend one suspicious purchase before a deeply unqualified court." disabled={!canPlayCourtroom} onClick={()=>onSelect("courtroom")}/></div></div>
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

type OrderedItem = GameItem & { originalIndex: number; gameId: string };
function shuffledOrder(items: OrderedItem[]) { const next=shuffle(items);return next.every((item,index)=>item.gameId===items[index]?.gameId)?[...next].reverse():next; }

function RebuildReceipt({receipt}:{receipt:ReceiptGameData}){
  const original=useMemo<OrderedItem[]>(()=>receipt.items.filter(item=>item.name.trim()).map((item,index)=>({...item,originalIndex:index,gameId:`${index}-${item.name}-${item.price}`})),[receipt.items]);
  const[ordered,setOrdered]=useState<OrderedItem[]>(()=>shuffledOrder(original));const[result,setResult]=useState<boolean|null>(null);
  function move(index:number,direction:-1|1){const target=index+direction;if(target<0||target>=ordered.length)return;setOrdered(current=>{const next=[...current];[next[index],next[target]]=[next[target],next[index]];return next});setResult(null)}
  function check(){setResult(ordered.every((item,index)=>item.gameId===original[index]?.gameId))}
  function nextRound(){setOrdered(shuffledOrder(original));setResult(null)}
  return <div className="mx-auto max-w-2xl"><div className="flex items-center gap-3"><ListRestart className="text-[#75a7ff]"/><div><span className="font-mono text-xs uppercase tracking-wider text-[#75a7ff]">rebuild mode</span><h2 className="text-2xl font-bold">Rebuild the Receipt</h2></div></div><p className="mt-6 text-[#c7d2e0]">Use the arrows to put the items back in the order they appeared on the original receipt.</p><ol className="mt-5 space-y-2">{ordered.map((item,index)=><li key={item.gameId} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/6 p-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/8 font-mono text-sm text-[#75a7ff]">{index+1}</span><div className="min-w-0 flex-1"><p className="truncate font-semibold">{item.name}</p><p className="mt-0.5 text-xs text-[#9fb0c8]">×{item.quantity||1} · {formatMoney(item.price,receipt.currency)}</p></div><div className="flex gap-1"><button onClick={()=>move(index,-1)} disabled={index===0} aria-label={`Move ${item.name} up`} className="grid size-9 place-items-center rounded-lg border border-white/12 hover:border-[#75a7ff] disabled:opacity-25"><ChevronUp size={17}/></button><button onClick={()=>move(index,1)} disabled={index===ordered.length-1} aria-label={`Move ${item.name} down`} className="grid size-9 place-items-center rounded-lg border border-white/12 hover:border-[#75a7ff] disabled:opacity-25"><ChevronDown size={17}/></button></div></li>)}</ol>{result===null?<button onClick={check} className="mt-6 w-full rounded-xl bg-[#155eef] px-5 py-3.5 font-bold hover:bg-[#2b6df2]">Check My Order</button>:<div className={`mt-6 rounded-2xl border p-5 ${result?"border-[#51c99a]/40 bg-[#17805c]/18":"border-[#ff8e86]/35 bg-[#b42318]/16"}`}><div className="flex items-center gap-3">{result?<Check className="text-[#63d3aa]"/>:<X className="text-[#ff8e86]"/>}<div><p className="font-bold">{result?"Receipt rebuilt!":"The order isn’t quite right"}</p><p className="mt-1 text-sm text-[#c7d2e0]">{result?"Every item is back where it belongs.":"Move a few items and check again, or start a fresh shuffle."}</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{!result&&<button onClick={()=>setResult(null)} className="rounded-xl border border-white/15 px-4 py-3 font-bold hover:border-[#75a7ff]">Keep Trying</button>}<button onClick={nextRound} className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-[#10213b] hover:bg-[#e8eef7]"><RotateCcw size={16}/>New Shuffle</button></div></div>}</div>
}

type CourtStage = "charge" | "defense" | "cross" | "verdict";
type CourtChoice = { label: string; detail: string; score: number };

function PurchaseCourtroom({receipt}:{receipt:ReceiptGameData}){
  const items=receipt.items.filter(item=>item.name.trim()&&Number.isFinite(item.price)&&item.price>=0);
  const receiptTotal=Number.isFinite(receipt.total)?Number(receipt.total):items.reduce((sum,item)=>sum+(item.price*(item.quantity||1)),0);
  const[current,setCurrent]=useState<GameItem|null>(()=>pickDifferentItem(items));
  const[previous,setPrevious]=useState(current?.name);
  const[stage,setStage]=useState<CourtStage>("charge");
  const[score,setScore]=useState(0);
  const[selectedDefense,setSelectedDefense]=useState<string>();
  const lineTotal=current?(current.price*(current.quantity||1)):0;
  const share=receiptTotal>0?Math.round((lineTotal/receiptTotal)*100):0;
  const quantity=current?.quantity||1;
  const defenses: CourtChoice[]=[
    {label:"It was essential",detail:"The household would not survive without it.",score:share<=20?2:0},
    {label:"I deserved a little treat",detail:"An emotional-support transaction.",score:1},
    {label:"It was basically an investment",detail:quantity>1?`I secured ${quantity} before the market noticed.`:"Future me will understand.",score:quantity>1?2:0},
  ];
  const crossExamination: CourtChoice[]=[
    {label:"Absolutely. No notes.",detail:"Maintain suspiciously strong eye contact.",score:lineTotal<=Math.max(receiptTotal*.25,10)?2:0},
    {label:"Only if it was on sale",detail:"The court requests evidence. None exists.",score:1},
    {label:"I invoke my right to snacks",detail:"Bold. Legally meaningless, but bold.",score:quantity>1?2:1},
  ];
  const charge=share>=40?`first-degree budget domination (${share}% of the entire receipt)` : quantity>=3?`possession of ${quantity} units with intent to snack` : lineTotal>=50?`aggravated wallet disturbance` : `suspiciously casual spending`;
  function chooseDefense(choice:CourtChoice){setSelectedDefense(choice.label);setScore(choice.score);setStage("cross")}
  function finish(choice:CourtChoice){setScore(value=>value+choice.score);setStage("verdict")}
  function nextCase(){const picked=pickDifferentItem(items,previous);setCurrent(picked);setPrevious(picked?.name);setSelectedDefense(undefined);setScore(0);setStage("charge")}
  const acquitted=score>=3;
  return <div className="mx-auto max-w-2xl">
    <div className="flex items-center gap-3"><Gavel className="text-[#f6c453]"/><div><span className="font-mono text-xs uppercase tracking-wider text-[#f6c453]">court is now in session</span><h2 className="text-2xl font-bold">Purchase Courtroom</h2></div></div>
    <div className="mt-7 overflow-hidden rounded-2xl border border-[#f6c453]/35 bg-[#101c2f] shadow-[6px_6px_0_#050b14]">
      <div className="flex items-center justify-between border-b border-[#f6c453]/25 bg-[#f6c453]/10 px-5 py-3 font-mono text-xs uppercase tracking-widest text-[#f6c453]"><span>The People v. Your Cart</span><span>Case #{String(current?.name.length||1).padStart(3,"0")}</span></div>
      <div className="p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-[#9fb0c8]">Item entered into evidence</p><h3 className="mt-1 text-2xl font-black text-white">{current?.name}</h3><p className="mt-2 font-mono text-sm text-[#c7d2e0]">{quantity} × {formatMoney(current?.price||0,receipt.currency)} = <strong className="text-white">{formatMoney(lineTotal,receipt.currency)}</strong></p></div><div className="grid size-20 shrink-0 place-items-center rounded-full border-2 border-[#f6c453] bg-[#f6c453]/10"><Scale size={34} className="text-[#f6c453]"/></div></div>
        {stage==="charge"&&<div className="mt-7"><p className="font-mono text-xs uppercase tracking-wider text-[#ff8e86]">Official charge</p><p className="mt-2 text-lg leading-7 text-white">You stand accused of <strong>{charge}</strong>.</p><button onClick={()=>setStage("defense")} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f6c453] px-5 py-3.5 font-black text-[#101725] hover:bg-[#ffdc7b]"><Gavel size={18}/>Enter a plea</button></div>}
        {stage==="defense"&&<CourtQuestion eyebrow="Your opening statement" question="How do you defend this purchase?" choices={defenses} onChoose={chooseDefense}/>}
        {stage==="cross"&&<CourtQuestion eyebrow="Cross-examination" question={`Would you buy ${current?.name} again?`} choices={crossExamination} onChoose={finish}/>}
        {stage==="verdict"&&<div className={`mt-7 rounded-xl border p-5 ${acquitted?"border-[#63d3aa]/45 bg-[#17805c]/15":"border-[#ff8e86]/40 bg-[#b42318]/15"}`}><p className="font-mono text-xs uppercase tracking-widest text-[#9fb0c8]">The jury has decided</p><h3 className="mt-2 text-2xl font-black">{acquitted?"NOT GUILTY-ish":"GUILTY OF VIBES"}</h3><p className="mt-3 leading-7 text-[#d7e0eb]">{acquitted?`Your defense of “${selectedDefense}” created just enough reasonable doubt. ${current?.name} may return to the cart.`:`The court sentences you to stare at ${formatMoney(lineTotal,receipt.currency)} on your bank statement and think about what you’ve done.`}</p><button onClick={nextCase} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-[#10213b] hover:bg-[#e8eef7]"><RotateCcw size={16}/>Try another item</button></div>}
      </div>
    </div>
  </div>
}

function CourtQuestion({eyebrow,question,choices,onChoose}:{eyebrow:string;question:string;choices:CourtChoice[];onChoose:(choice:CourtChoice)=>void}){
  return <div className="mt-7"><p className="font-mono text-xs uppercase tracking-wider text-[#75a7ff]">{eyebrow}</p><h3 className="mt-2 text-lg font-bold">{question}</h3><div className="mt-4 grid gap-3">{choices.map(choice=><button key={choice.label} onClick={()=>onChoose(choice)} className="group rounded-xl border border-white/14 bg-white/5 px-4 py-3 text-left transition hover:border-[#f6c453] hover:bg-[#f6c453]/10"><span className="block font-bold text-white">{choice.label}</span><span className="mt-1 block text-sm leading-5 text-[#9fb0c8] group-hover:text-[#d7e0eb]">{choice.detail}</span></button>)}</div></div>
}

function ItemGrid({items}:{items:GameItem[]}){return <div className="mt-5 grid gap-2 sm:grid-cols-2">{items.map((item,index)=><div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"><span className="font-semibold">{item.name}</span><span className="text-xs text-[#9fb0c8]">×{item.quantity||1}</span></div>)}</div>}
function Result({correct,text,action,onNext}:{correct:boolean;text:string;action:string;onNext:()=>void}){return <div className={`mt-6 rounded-2xl border p-5 ${correct?"border-[#51c99a]/40 bg-[#17805c]/18":"border-[#ff8e86]/35 bg-[#b42318]/16"}`}><div className="flex items-center gap-3">{correct?<Check className="text-[#63d3aa]"/>:<X className="text-[#ff8e86]"/>}<div><p className="font-bold">{correct?"Correct!":"Good try"}</p><p className="mt-1 text-sm text-[#c7d2e0]">Answer: <strong className="text-white">{text}</strong></p></div></div><button onClick={onNext} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-[#10213b] hover:bg-[#e8eef7]"><RotateCcw size={16}/>{action}</button></div>}
