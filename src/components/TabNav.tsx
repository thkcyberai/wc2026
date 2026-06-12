'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from './LanguageProvider';

const TABS = [
  { href: '/', key: 'nav.today' },
  { href: '/groups', key: 'nav.groups' },
  { href: '/calendar', key: 'nav.calendar' },
  { href: '/knockout', key: 'nav.knockout' },
  { href: '/players', key: 'nav.players' },
  { href: '/scorers', key: 'nav.scorers' },
  { href: '/settings', key: 'nav.settings' },
];

export default function TabNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
              active
                ? 'bg-accent text-pitch-950'
                : 'text-zinc-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
