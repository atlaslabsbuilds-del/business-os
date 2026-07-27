import type { Metadata } from "next";
import { LandingPage } from "../components/landing/landing-page";
import "./landing.css";

export const metadata: Metadata = {
  title: "VanderBase — The AI-Native Business OS",
  description: "The AI-native Business OS for modern businesses.",
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
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <LandingPage />;
}
