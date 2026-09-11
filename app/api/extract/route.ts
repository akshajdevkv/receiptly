import { NextResponse } from "next/server";
import { env } from "cloudflare:workers";

const schema={type:"OBJECT",properties:{merchant:{type:"STRING"},date:{type:"STRING"},receiptNumber:{type:"STRING"},currency:{type:"STRING"},subtotal:{type:"NUMBER",nullable:true},tax:{type:"NUMBER",nullable:true},tip:{type:"NUMBER",nullable:true},total:{type:"NUMBER",nullable:true},paymentMethod:{type:"STRING"},category:{type:"STRING"},items:{type:"ARRAY",items:{type:"OBJECT",properties:{name:{type:"STRING"},quantity:{type:"NUMBER"},price:{type:"NUMBER"}},required:["name","quantity","price"]}}},required:["merchant","date","receiptNumber","currency","subtotal","tax","tip","total","paymentMethod","category","items"]};
type ReceiptData={merchant:string;date:string;receiptNumber:string;currency:string;subtotal:number|null;tax:number|null;tip:number|null;total:number|null;paymentMethod:string;category:string;items:{name:string;quantity:number;price:number}[]};
const cents=(value:number|null)=>value==null?null:Math.round(value*100);

export async function POST(request:Request){
  try{
    const key=process.env.GEMINI_API_KEY;
    if(!key)return NextResponse.json({error:"Gemini is not configured. Add GEMINI_API_KEY to your environment."},{status:503});
    if(!env.DB||!env.BUCKET)return NextResponse.json({error:"Receipt storage is not configured."},{status:503});
    const form=await request.formData();const file=form.get("receipt");
    if(!(file instanceof File))return NextResponse.json({error:"Choose a receipt first."},{status:400});
    if(file.size>10485760)return NextResponse.json({error:"Receipt must be under 10 MB."},{status:413});
    if(!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.type))return NextResponse.json({error:"Unsupported file type."},{status:415});
    const bytes=new Uint8Array(await file.arrayBuffer());let binary="";
    for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    const response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},signal:AbortSignal.timeout(45000),body:JSON.stringify({contents:[{parts:[{text:"Extract this receipt faithfully. Do not guess unreadable values; use empty strings or null. Return dates as YYYY-MM-DD when possible. Item price is the displayed line total."},{inlineData:{mimeType:file.type,data:btoa(binary)}}]}],generationConfig:{responseMimeType:"application/json",responseSchema:schema,temperature:.1,thinkingConfig:{thinkingLevel:"minimal"}}})});
    const result=await response.json() as {candidates?:{content?:{parts?:{text?:string}[]}}[];error?:{message?:string}};
    if(!response.ok)throw new Error(result.error?.message||"Gemini could not process this receipt.");
    const text=result.candidates?.[0]?.content?.parts?.find(p=>p.text)?.text;
    if(!text)throw new Error("Gemini returned no receipt data. Try a clearer image.");
    const data=JSON.parse(text) as ReceiptData;const id=crypto.randomUUID();const imageKey=`receipts/${id}`;const createdAt=Date.now();
    await env.BUCKET.put(imageKey,bytes,{httpMetadata:{contentType:file.type}});
    try{await env.DB.prepare(`INSERT INTO receipts (id,merchant,purchase_date,receipt_number,currency,subtotal_cents,tax_cents,tip_cents,total_cents,payment_method,category,items_json,image_key,image_type,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,data.merchant||"Unknown merchant",data.date||"",data.receiptNumber||"",data.currency||"USD",cents(data.subtotal),cents(data.tax),cents(data.tip),cents(data.total),data.paymentMethod||"",data.category||"Purchase",JSON.stringify(data.items||[]),imageKey,file.type,createdAt).run()}catch(error){await env.BUCKET.delete(imageKey);throw error}
    return NextResponse.json({...data,id,createdAt});
  }catch(error){console.error("Receipt extraction failed",error);const timedOut=error instanceof Error&&(error.name==="TimeoutError"||error.name==="AbortError");return NextResponse.json({error:timedOut?"Gemini took too long to respond. Please try again with a smaller or clearer image.":error instanceof Error?error.message:"Receipt extraction failed."},{status:timedOut?504:500})}
}
