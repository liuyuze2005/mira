import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mira — Visual Reading Companion",
  description: "A visual reading companion for people with aphantasia. Generate character portraits, scene maps, and key moment illustrations for the books you're reading.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
