'use client';

import RefreshButton from '@/components/RefreshButton';
import { ErrorBox, Loading } from '@/components/ui';
import { useFetch } from '@/components/useFetch';

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
        <h2 className="font-bold">Data</h2>
        <p className="text-sm text-zinc-400">
          Scores and standings update automatically several times a day. You can also trigger an
          update manually:
        </p>
        <RefreshButton onDone={reload} />
        {data.lastRefresh && (
          <p className="text-[12px] text-zinc-500">
            Last update: {new Date(data.lastRefresh.ran_at).toLocaleString()}
          </p>
        )}
      </div>

      <div className="card p-5">
        <h2 className="mb-3 flex items-baseline justify-between font-bold">
          Update history
          <span className="text-[10px] font-normal text-zinc-600">
            match data courtesy of{' '}
            <a href="https://www.football-data.org" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400">
              football-data.org
            </a>
          </span>
        </h2>
        {data.logs.length === 0 ? (
          <p className="text-sm text-zinc-500">No updates yet.</p>
        ) : (
          <ul className="space-y-2 text-[13px]">
            {data.logs.map((log) => (
              <li key={log.id} className="flex flex-wrap items-baseline gap-x-3 border-b border-white/5 pb-2">
                <span className={log.ok ? 'text-accent' : 'text-red-300'}>{log.ok ? '✓' : '✗'}</span>
                <span className="font-mono text-zinc-400">{new Date(log.ran_at).toLocaleString()}</span>
                <span className="text-zinc-500">
                  {log.ok
                    ? `${log.matches_updated} match${log.matches_updated === 1 ? '' : 'es'} updated`
                    : 'no new data'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
