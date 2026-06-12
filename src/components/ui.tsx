'use client';

// Small shared UI primitives: loading, error and status chips (i18n-aware).

import { useI18n } from './LanguageProvider';

export function Loading({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-zinc-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-accent" />
      <span className="text-sm">{label ?? t('common.loading')}</span>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="card border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
      <p className="font-semibold">{t('common.wrong')}</p>
      <p className="mt-1 text-red-300/90">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-3">
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}

export function StatusChip({ status }: { status: 'scheduled' | 'live' | 'finished' }) {
  const { t } = useI18n();
  if (status === 'live') {
    return (
      <span className="chip bg-red-500/20 text-red-300">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> {t('status.live')}
      </span>
    );
  }
  if (status === 'finished') {
    return <span className="chip bg-zinc-500/20 text-zinc-300">{t('status.ft')}</span>;
  }
  return <span className="chip bg-sky-500/20 text-sky-300">{t('status.sched')}</span>;
}

export function QualBadge({ status }: { status: string }) {
  const { t } = useI18n();
  switch (status) {
    case 'qualified':
      return <span className="chip bg-accent/20 text-accent">{t('qual.q')}</span>;
    case 'best-third':
      return <span className="chip bg-gold/20 text-gold">{t('qual.third')}</span>;
    case 'in-contention':
      return <span className="chip bg-sky-500/15 text-sky-300">{t('qual.cont')}</span>;
    case 'eliminated':
      return <span className="chip bg-red-500/15 text-red-300">{t('qual.elim')}</span>;
    default:
      return <span className="text-zinc-600">—</span>;
  }
}
