import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans-vn",
});

export const metadata: Metadata = {
  title: "GP Interior AI — Thiết kế nội thất AI",
  description: "Hình dung không gian nội thất của bạn trước khi thi công",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${manrope.variable} h-full`}>
      <body className="h-full bg-white text-stone-800 antialiased">
        <TooltipProvider delayDuration={200}>
          {children}
        </TooltipProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
