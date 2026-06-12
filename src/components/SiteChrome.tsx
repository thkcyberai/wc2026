'use client';

import { useI18n } from './LanguageProvider';

export function HeaderSubtitle() {
  const { t } = useI18n();
  return <p className="text-[11px] text-zinc-400">{t('hdr.subtitle')}</p>;
}

export function FooterBar() {
  const { t } = useI18n();
  return (
    <footer className="mx-auto max-w-6xl space-y-1 px-4 pb-8 text-center text-[11px] text-zinc-500">
      <p className="font-semibold text-zinc-400">
        {t('footer.rights')}{' '}
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
        💬 {t('footer.feedback')}{' '}
        <a
          href="mailto:contact@facti.ai?subject=WC2026%20Calendar%20Tracker%20feedback"
          className="text-accent hover:underline"
        >
          contact@facti.ai
        </a>
      </p>
    </footer>
  );
}
