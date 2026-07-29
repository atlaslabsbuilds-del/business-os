import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "VanderBase Admin",
    template: "%s | VanderBase Admin",
  },
  description: "VanderBase administration console.",
  applicationName: "VanderBase Admin",
  icons: {
    icon: [
      { url: "/branding/vanderbase-icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/branding/vanderbase-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/branding/vanderbase-icon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: {
      url: "/branding/vanderbase-icon-180.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
  other: {
    "theme-color": "#0B0B0B",
  },
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
