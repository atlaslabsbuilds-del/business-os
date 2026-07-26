import type { Metadata } from "next";
import { LandingPage } from "../components/landing/landing-page";
import "./landing.css";

export const metadata: Metadata = {
  title: "Business OS — Run Your Entire Business With One AI Operating System",
  description:
    "One workspace. One AI. One subscription. Business OS unifies CRM, Inbox, Content, Social, Calendar, Finance, Analytics, and AI Studio.",
  openGraph: {
    title: "Business OS",
    description:
      "The AI-native operating system for founders and modern teams. One workspace. One AI. One subscription.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Business OS",
    description:
      "Run your entire business with one AI operating system.",
  },
};

export default function HomePage() {
  return <LandingPage />;
}
