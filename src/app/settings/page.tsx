'use client';

import RefreshButton from '@/components/RefreshButton';
import { ErrorBox, Loading } from '@/components/ui';
import { useFetch } from '@/components/useFetch';
import { useI18n } from '@/components/LanguageProvider';

interface PublicLog {
  id: number;
  ran_at: string;
  ok: number;
  matches_updated: number;
}

interface MetaData {
  teams: number;
  matches: number;
  finished: number;
  lastRefresh: { ran_at: string; ok: number; matches_updated: number } | null;
  logs: PublicLog[];
}

export default function SettingsPage() {
  const { data, loading, error, reload } = useFetch<MetaData>('/api/meta');
  const { t, locale } = useI18n();

  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox message={error ?? 'No data'} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">{t('set.teams')}</p>
          <p className="text-3xl font-extrabold">{data.teams}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">{t('set.matches')}</p>
          <p className="text-3xl font-extrabold">{data.matches}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">{t('set.finished')}</p>
          <p className="text-3xl font-extrabold">{data.finished}</p>
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <h2 className="font-bold">{t('set.data')}</h2>
        <p className="text-sm text-zinc-400">{t('set.dataDesc')}</p>
        <RefreshButton onDone={reload} />
        {data.lastRefresh && (
          <p className="text-[12px] text-zinc-500">
            {t('set.last')} {new Date(data.lastRefresh.ran_at).toLocaleString(locale)}
          </p>
        )}
      </div>

      <div className="card p-5">
        <h2 className="mb-3 flex items-baseline justify-between font-bold">
          {t('set.hist')}
          <span className="text-[10px] font-normal text-zinc-600">
            match data courtesy of{' '}
            <a href="https://www.football-data.org" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400">
              football-data.org
            </a>
          </span>
        </h2>
        {data.logs.length === 0 ? (
          <p className="text-sm text-zinc-500">{t('set.none')}</p>
        ) : (
          <ul className="space-y-2 text-[13px]">
            {data.logs.map((log) => (
              <li key={log.id} className="flex flex-wrap items-baseline gap-x-3 border-b border-white/5 pb-2">
                <span className={log.ok ? 'text-accent' : 'text-red-300'}>{log.ok ? '✓' : '✗'}</span>
                <span className="font-mono text-zinc-400">{new Date(log.ran_at).toLocaleString(locale)}</span>
                <span className="text-zinc-500">
                  {log.ok ? t('set.upd', { n: log.matches_updated }) : t('set.nonew')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
