import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Google Agentic Browser — The browser that does",
  description:
    "An independent browser concept combining agent missions, workspace views, decision logs and demo payments. Not affiliated with Google.",
  keywords: [
    "Google Agentic Browser",
    "Gemini Browser",
    "Agentic Browser",
    "AI Browser",
    "Google AI",
    "Gemini",
    "Next.js",
  ],
  authors: [{ name: "Independent concept prototype" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Google Agentic Browser",
    description: "Independent agentic browser concept with supervised workflows.",
    siteName: "Google Agentic Browser",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Google Agentic Browser",
    description: "Independent agentic browser concept with supervised workflows.",
  },
};

export const viewport: Viewport = {
  themeColor: "#060814",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className="antialiased"
        style={{ background: "var(--ag-bg)", color: "var(--ag-text)" }}
      >
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "rgba(8,10,22,0.92)",
              color: "#F4F5FF",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(20px)",
            },
          }}
        />
      </body>
    </html>
  );
}
