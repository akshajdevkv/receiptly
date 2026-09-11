import type {Metadata} from "next";import "./globals.css";
export const metadata:Metadata={title:"Receiptly — AI Receipt Scanner",description:"Extract merchant, totals, and line items from receipts with Gemini.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className="antialiased">{children}</body></html>}
