import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "VanderBase — The AI-Native Business OS",
    template: "%s | VanderBase",
  },
  description:
    "The AI-native Business OS for modern businesses.",
  keywords: [
    "VanderBase",
    "AI operating system",
    "CRM",
    "AI inbox",
    "content OS",
    "workspace",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VanderBase — The AI-Native Business OS",
    description: "The AI-native Business OS for modern businesses.",
    url: "/",
    siteName: "VanderBase",
    type: "website",
    images: [{ url: "/branding/vanderbase-icon-512.png", width: 512, height: 512, alt: "VanderBase" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VanderBase — The AI-Native Business OS",
    description: "The AI-native Business OS for modern businesses.",
    images: ["/branding/vanderbase-icon-512.png"],
  },
  icons: {
    icon: [
      { url: "/branding/vanderbase-icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/branding/vanderbase-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/branding/vanderbase-icon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: { url: "/branding/vanderbase-icon-180.png", sizes: "180x180", type: "image/png" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "VanderBase",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "The AI-native Business OS for modern businesses.",
    brand: {
      "@type": "Brand",
      name: "VanderBase",
    },
  };

  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
