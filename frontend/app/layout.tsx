import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "CopilotHire — AI Interview Assistant",
  description: "AI-powered interview copilot for hiring managers. Smart questions, real-time evaluation, structured reports.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..700;1,14..32,300..600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#F8F7FF] text-gray-900 min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}