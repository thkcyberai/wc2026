'use client';

import Link from 'next/link';
import MatchCard from '@/components/MatchCard';
import RefreshButton from '@/components/RefreshButton';
import { ErrorBox, Loading } from '@/components/ui';
import { useFetch } from '@/components/useFetch';
import type { MatchView } from '@/lib/types';

interface DashboardData {
  today: string;
  todays: MatchView[];
  live: MatchView[];
  latest: MatchView[];
  upcoming: MatchView[];
  meta: { lastRefresh: { ran_at: string; source: string } | null; prettyToday: string };
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

  if (loading) return <Loading label="Loading dashboard…" />;
  if (error || !data) return <ErrorBox message={error ?? 'No data'} onRetry={reload} />;

  return (
    <div className="space-y-8">
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold">{data.meta.prettyToday}</h2>
          <p className="mt-1 text-[12px] text-zinc-400">
            {data.meta.lastRefresh
              ? `Last updated: ${new Date(data.meta.lastRefresh.ran_at).toLocaleString()} (${data.meta.lastRefresh.source})`
              : 'Not refreshed yet — using seeded data.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RefreshButton onDone={reload} />
          <Link href="/groups" className="btn-ghost">View Groups</Link>
          <Link href="/calendar" className="btn-ghost">View Calendar</Link>
          <Link href="/knockout" className="btn-ghost">View Bracket</Link>
        </div>
      </div>

      {data.live.length > 0 && (
        <Section title="🔴 Live now" matches={data.live} empty="" />
      )}
      <Section title="Today's matches" matches={data.todays} empty="No matches today." />
      <Section title="Latest results" matches={data.latest} empty="No finished matches yet." />
      <Section title="Next up" matches={data.upcoming} empty="No upcoming matches." />
    </div>
  );
}
