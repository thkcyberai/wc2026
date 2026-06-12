'use client';

import RefreshButton from '@/components/RefreshButton';
import { ErrorBox, Loading } from '@/components/ui';
import { useFetch } from '@/components/useFetch';
import type { RefreshLog } from '@/lib/types';

interface MetaData {
  teams: number;
  matches: number;
  finished: number;
  lastRefresh: RefreshLog | null;
  logs: RefreshLog[];
  openAiConfigured: boolean;
  footballDataConfigured: boolean;
  apiFootballConfigured: boolean;
}

function Dot({ ok }: { ok: boolean }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-accent' : 'bg-red-400'}`} />;
}

export default function SettingsPage() {
  const { data, loading, error, reload } = useFetch<MetaData>('/api/meta');

  if (loading) return <Loading label="Loading settings…" />;
  if (error || !data) return <ErrorBox message={error ?? 'No data'} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">Teams</p>
          <p className="text-3xl font-extrabold">{data.teams}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">Matches</p>
          <p className="text-3xl font-extrabold">{data.matches}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">Finished</p>
          <p className="text-3xl font-extrabold">{data.finished}</p>
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <h2 className="font-bold">Data sources</h2>
        <p className="flex items-center gap-2 text-sm text-zinc-300">
          <Dot ok={data.footballDataConfigured} />
          football-data.org API key{' '}
          {data.footballDataConfigured ? 'configured' : 'missing — add FOOTBALL_DATA_API_KEY to .env (free key, recommended)'}
        </p>
        <p className="flex items-center gap-2 text-sm text-zinc-300">
          <Dot ok={data.openAiConfigured} />
          OpenAI API key{' '}
          {data.openAiConfigured ? 'configured (data normalization enabled)' : 'missing — add OPENAI_API_KEY to .env'}
        </p>
        <p className="flex items-center gap-2 text-sm text-zinc-300">
          <Dot ok={data.apiFootballConfigured} />
          API-Football key{' '}
          {data.apiFootballConfigured
            ? 'configured (squads, photos, goalscorers & cards enabled)'
            : 'missing — add API_FOOTBALL_KEY (free at dashboard.api-sports.io) for squads, photos, scorers & cards'}
        </p>
        <p className="text-[12px] text-zinc-500">
          OpenAI is used server-side only, to normalize team/venue names, standardize statuses and
          explain refresh errors. It is never used as the source of scores.
        </p>
        <RefreshButton onDone={reload} />
        <p className="text-[12px] text-zinc-500">
          Tip: refresh daily during the tournament — or run <code className="rounded bg-white/10 px-1">npm run refresh</code>{' '}
          from a scheduler (e.g. Windows Task Scheduler).
        </p>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-bold">Refresh history</h2>
        {data.logs.length === 0 ? (
          <p className="text-sm text-zinc-500">No refreshes yet.</p>
        ) : (
          <ul className="space-y-2 text-[13px]">
            {data.logs.map((log) => (
              <li key={log.id} className="flex flex-wrap items-baseline gap-x-3 border-b border-white/5 pb-2">
                <span className={log.ok ? 'text-accent' : 'text-red-300'}>{log.ok ? '✓' : '✗'}</span>
                <span className="font-mono text-zinc-400">{new Date(log.ran_at).toLocaleString()}</span>
                <span className="text-zinc-300">{log.source}</span>
                <span className="text-zinc-500">{log.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
