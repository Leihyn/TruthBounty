import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ConnectWallet } from "@/components/ConnectWallet";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { MobileNav, DesktopNav } from "@/components/MobileNav";
import { TruthBountyLogo } from "@/components/TruthBountyLogo";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import Link from "next/link";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "TruthBounty - On-Chain Reputation for Prediction Markets",
  description: "Verify your prediction market performance and build your on-chain reputation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans`}
      >
        <Providers>
          <AnimatedBackground />
          <ErrorBoundary>
            <div className="flex flex-col min-h-screen">
              <header className="sticky top-0 z-50 w-full border-b-4 border-amber-400/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-4">
                  <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <TruthBountyLogo size={40} />
                    <span className="text-2xl md:text-3xl font-black tracking-widest bg-gradient-to-r from-red-500 via-amber-500 to-blue-500 bg-clip-text text-transparent uppercase italic transform -skew-y-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)]">
                      TRUTHBOUNTY
                    </span>
                  </Link>

                  {/* Desktop Navigation */}
                  <div className="hidden md:flex items-center gap-4">
                    <DesktopNav />
                    <ConnectWallet />
                  </div>

                  {/* Mobile Navigation */}
                  <div className="flex md:hidden items-center gap-2">
                    <MobileNav />
                  </div>
                </div>
              </header>
              <main className="flex-1">
                {children}
              </main>
              <footer className="border-t-4 border-amber-400/50 py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                  <div className="flex items-center gap-2">
                    <TruthBountyLogo size={24} />
                    <p className="text-sm text-amber-400 font-black uppercase italic tracking-wider">
                      Decentralized Reputation Protocol
                    </p>
                  </div>
                </div>
              </footer>
            </div>
          </ErrorBoundary>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
