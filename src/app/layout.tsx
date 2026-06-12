import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import TabNav from '@/components/TabNav';
import { LanguageProvider, LanguageSwitcher } from '@/components/LanguageProvider';
import { FooterBar, HeaderSubtitle } from '@/components/SiteChrome';

export const metadata: Metadata = {
  title: 'WC2026 Calendar Tracker',
  description: 'FIFA World Cup 2026 — calendar, groups, scores and knockout bracket (USA · Canada · Mexico)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Plausible Analytics — privacy-friendly, no cookies */}
        <Script
          async
          src="https://plausible.io/js/pa-tkC-Ft_PVtjiSRmASrcED.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-init" strategy="afterInteractive">
          {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init();`}
        </Script>
      </head>
      <body className="min-h-screen">
        <LanguageProvider>
          <header className="sticky top-0 z-40 border-b border-white/10 bg-pitch-950/85 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>⚽</span>
                  <div>
                    <h1 className="text-lg font-extrabold tracking-tight">
                      WC2026 <span className="text-accent">Calendar Tracker</span>
                    </h1>
                    <HeaderSubtitle />
                  </div>
                </div>
                <div className="lg:hidden">
                  <LanguageSwitcher />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TabNav />
                <div className="hidden lg:block">
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          <FooterBar />
        </LanguageProvider>
      </body>
    </html>
  );
}
