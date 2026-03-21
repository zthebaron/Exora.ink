import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ChatWidget } from "@/components/chat-widget";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://exora-ink.vercel.app"),
  title: {
    default: "Exora.ink — DTF Printing Intelligence Platform",
    template: "%s | Exora.ink",
  },
  description:
    "Professional DTF profitability analysis, pricing optimization, and business intelligence for modern print operations.",
  keywords: [
    "DTF printing",
    "direct to film",
    "DTF calculator",
    "DTF pricing",
    "DTF profitability",
    "DTF business",
    "garment printing",
    "custom apparel",
    "print cost calculator",
    "DTF equipment",
    "DTF ink cost",
    "DTF transfer",
    "print shop management",
    "DTF vs screen printing",
  ],
  openGraph: {
    title: "Exora.ink — DTF Printing Intelligence Platform",
    description:
      "Professional DTF profitability analysis, pricing optimization, and business intelligence for modern print operations.",
    url: "https://exora-ink.vercel.app",
    siteName: "Exora.ink",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Exora.ink — DTF Printing Intelligence Platform",
    description:
      "Professional DTF profitability analysis, pricing optimization, and business intelligence for modern print operations.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <ChatWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
