import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import TabNav from '@/components/TabNav';

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
        <header className="sticky top-0 z-40 border-b border-white/10 bg-pitch-950/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden>⚽</span>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight">
                  WC2026 <span className="text-accent">Calendar Tracker</span>
                </h1>
                <p className="text-[11px] text-zinc-400">
                  FIFA World Cup 2026 · USA · Canada · Mexico · Jun 11 – Jul 19
                </p>
              </div>
            </div>
            <TabNav />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl space-y-1 px-4 pb-8 text-center text-[11px] text-zinc-500">
          <p className="font-semibold text-zinc-400">
            All rights reserved by{' '}
            <a
              href="https://facti.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Facti.ai
            </a>
          </p>
          <p>
            💬 Feedback &amp; contact:{' '}
            <a
              href="mailto:contact@facti.ai?subject=WC2026%20Calendar%20Tracker%20feedback"
              className="text-accent hover:underline"
            >
              contact@facti.ai
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
