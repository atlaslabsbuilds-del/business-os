import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VanderBase API",
  description: "The VanderBase API.",
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
