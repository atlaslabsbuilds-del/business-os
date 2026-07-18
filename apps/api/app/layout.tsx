import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business OS API",
  description: "API application for the Business OS platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
