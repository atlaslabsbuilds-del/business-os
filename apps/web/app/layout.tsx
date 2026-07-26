import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Business OS",
    template: "%s | Business OS",
  },
  description:
    "AI-native Business Operating System — one workspace, one AI, one subscription for CRM, Inbox, Content, Social, Calendar, Finance, and AI Studio.",
  keywords: [
    "Business OS",
    "AI operating system",
    "CRM",
    "AI inbox",
    "content OS",
    "workspace",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
