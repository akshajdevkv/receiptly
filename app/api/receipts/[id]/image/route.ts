import { getLocalReceiptImage, getReceipt } from "@/lib/receipt-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const{id}=await params;const receipt=await getReceipt(id);
  if(!receipt)return new Response("Not found",{status:404});
  if(receipt.imageBlobUrl)return NextResponse.redirect(receipt.imageBlobUrl);
  const image=await getLocalReceiptImage(receipt);
  if(!image)return new Response("Not found",{status:404});
  return new Response(image,{headers:{"Content-Type":receipt.imageType,"Cache-Control":"private, max-age=3600"}});
}
