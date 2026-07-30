import type { Metadata } from "next";
import { LandingPage } from "../components/landing/landing-page";
import "./landing.css";

export const metadata: Metadata = {
  title: "VanderBase Public Beta — The AI-Native Business OS",
  description:
    "Join VanderBase public beta: CRM, Finance, Projects, Documents, Calendar, Analytics, Notifications, Integrations, Security, PWA, and Kairos AI in one premium Business OS.",
  keywords: [
    "VanderBase",
    "public beta",
    "AI Business OS",
    "CRM",
    "project management",
    "finance dashboard",
    "Kairos AI",
  ],
  openGraph: {
    title: "VanderBase Public Beta — The AI-Native Business OS",
    description:
      "Run CRM, Finance, Projects, Documents, Calendar, Analytics, Notifications, Security, and Kairos AI from one premium workspace.",
    url: "/",
    siteName: "VanderBase",
    type: "website",
    images: [
      {
        url: "/branding/vanderbase-og.png",
        width: 1200,
        height: 630,
        alt: "VanderBase — The AI-Native Business OS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VanderBase Public Beta — The AI-Native Business OS",
    description:
      "Join the public beta for the AI-native Business OS for modern teams.",
    images: ["/branding/vanderbase-og.png"],
  },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <LandingPage />;
}
