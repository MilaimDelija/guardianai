import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "GuardianAI — The Security Layer for AI Systems",
  description: "Detects prompt injection, jailbreaks, deepfakes, and adversarial attacks in real time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        </head>
        <body style={{ fontFamily: "'DM Sans', sans-serif" }}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
