'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import MatchCard from '@/components/MatchCard';
import RefreshButton from '@/components/RefreshButton';
import { ErrorBox, Loading } from '@/components/ui';
import { useFetch } from '@/components/useFetch';
import { useI18n } from '@/components/LanguageProvider';
import type { MatchView } from '@/lib/types';

interface DashboardData {
  today: string;
  todays: MatchView[];
  live: MatchView[];
  latest: MatchView[];
  upcoming: MatchView[];
  meta: { lastRefresh: { ran_at: string } | null; prettyToday: string };
}

function Section({ title, matches, empty }: { title: string; matches: MatchView[]; empty: string }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-400">{title}</h2>
      {matches.length === 0 ? (
        <p className="card p-4 text-sm text-zinc-500">{empty}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const { data, loading, error, reload } = useFetch<DashboardData>('/api/dashboard');
  const { t, locale } = useI18n();

  // auto-reload the dashboard every 60s while a match is live
  const hasLive = (data?.live?.length ?? 0) > 0;
  useEffect(() => {
    if (!hasLive) return;
    const id = setInterval(() => void reload(), 60_000);
    return () => clearInterval(id);
  }, [hasLive, reload]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox message={error ?? 'No data'} onRetry={reload} />;

  const prettyToday = new Date().toLocaleDateString(locale, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="space-y-8">
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold">{prettyToday}</h2>
          <p className="mt-1 text-[12px] text-zinc-400">
            {data.meta.lastRefresh
              ? `${t('dash.lastUpdated')} ${new Date(data.meta.lastRefresh.ran_at).toLocaleString(locale)}`
              : t('dash.pending')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RefreshButton onDone={reload} />
          <Link href="/groups" className="btn-ghost">{t('dash.viewGroups')}</Link>
          <Link href="/calendar" className="btn-ghost">{t('dash.viewCalendar')}</Link>
          <Link href="/knockout" className="btn-ghost">{t('dash.viewBracket')}</Link>
        </div>
      </div>

      {data.live.length > 0 && (
        <Section title={t('dash.live')} matches={data.live} empty="" />
      )}
      <Section title={t('dash.today')} matches={data.todays} empty={t('dash.noToday')} />
      <Section title={t('dash.latest')} matches={data.latest} empty={t('dash.noFin')} />
      <Section title={t('dash.next')} matches={data.upcoming} empty={t('dash.noUp')} />
    </div>
  );
}
