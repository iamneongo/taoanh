import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "VisioNT — Thiết kế nội thất AI",
  description: "Hình dung không gian nội thất của bạn trước khi thi công",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${geist.variable} h-full`}>
      <body className="h-full bg-white text-stone-800 antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
