import type {Metadata} from "next";import "./globals.css";
export const metadata:Metadata={title:"Receiptly — Smart Receipt Scanner",description:"Save receipt images and extract merchant, totals, and line-item details.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className="antialiased">{children}</body></html>}
