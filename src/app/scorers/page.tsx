'use client';

import Flag from '@/components/Flag';
import PlayerPhoto from '@/components/PlayerPhoto';
import { ErrorBox, Loading } from '@/components/ui';
import { useFetch } from '@/components/useFetch';

interface ScorerRow {
  rank: number;
  player_name: string;
  photo_url: string | null;
  team_name: string | null;
  team_code: string | null;
  goals: number;
}

export default function ScorersPage() {
  const { data, loading, error, reload } = useFetch<{ source: string; scorers: ScorerRow[] }>('/api/scorers');

  if (loading) return <Loading label="Loading goal ranking…" />;
  if (error || !data) return <ErrorBox message={error ?? 'No data'} onRetry={reload} />;

  const max = data.scorers[0]?.goals ?? 1;

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-extrabold">⚽ Top Scorers</h2>
        <span className="text-[11px] text-zinc-500">source: {data.source}</span>
      </div>

      {data.scorers.length === 0 ? (
        <p className="card p-6 text-sm text-zinc-500">
          No goals recorded yet — the ranking fills up automatically as matches finish and data
          refreshes. (Player photos require squads to be loaded on the Players tab.)
        </p>
      ) : (
        <div className="card divide-y divide-white/5">
          {data.scorers.map((s) => (
            <div key={`${s.rank}-${s.player_name}`} className="flex items-center gap-3 px-4 py-3">
              <span className={`w-8 text-center font-mono text-sm font-bold ${
                s.rank === 1 ? 'text-gold' : s.rank <= 3 ? 'text-accent' : 'text-zinc-500'
              }`}>
                {s.rank}
              </span>
              <PlayerPhoto src={s.photo_url} name={s.player_name} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s.player_name}</p>
                <p className="flex items-center gap-1.5 text-[12px] text-zinc-400">
                  {s.team_code && <Flag code={s.team_code} name={s.team_name ?? ''} size="sm" />}
                  {s.team_name ?? ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden h-2 w-32 overflow-hidden rounded-full bg-white/10 sm:block">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.max(8, (s.goals / max) * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-right text-lg font-extrabold tabular-nums">{s.goals}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
