'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Today' },
  { href: '/groups', label: 'Groups' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/knockout', label: 'Knockout' },
  { href: '/settings', label: 'Settings' },
];

export default function TabNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
              active
                ? 'bg-accent text-pitch-950'
                : 'text-zinc-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
