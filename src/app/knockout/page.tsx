'use client';

import { ErrorBox, Loading, StatusChip } from '@/components/ui';
import { useFetch } from '@/components/useFetch';
import Flag from '@/components/Flag';
import type { MatchView } from '@/lib/types';

interface KnockoutData {
  r32: MatchView[]; r16: MatchView[]; qf: MatchView[];
  sf: MatchView[]; third: MatchView[]; final: MatchView[];
}

function Side({
  team, placeholder, score, pens, winner,
}: {
  team: { code: string; name: string } | null;
  placeholder: string | null;
  score: number | null;
  pens: number | null;
  winner: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-2 ${winner ? 'text-accent' : ''}`}>
      {team ? (
        <span className="flex min-w-0 items-center gap-2">
          <Flag code={team.code} name={team.name} size="sm" />
          <span className={`truncate text-sm ${winner ? 'font-bold' : 'font-semibold'}`}>{team.name}</span>
        </span>
      ) : (
        <span className="truncate text-[12px] italic text-zinc-500">{placeholder ?? 'TBD'}</span>
      )}
      <span className="font-mono text-sm font-bold tabular-nums">
        {score !== null ? score : ''}
        {pens !== null && <span className="text-[10px] text-zinc-400"> ({pens})</span>}
      </span>
    </div>
  );
}

function BracketCard({ m }: { m: MatchView }) {
  const finished = m.status === 'finished' && m.home_score !== null && m.away_score !== null;
  let homeWins = false, awayWins = false;
  if (finished) {
    if (m.home_score! !== m.away_score!) {
      homeWins = m.home_score! > m.away_score!;
      awayWins = !homeWins;
    } else if (m.home_penalties !== null && m.away_penalties !== null && m.home_penalties !== m.away_penalties) {
      homeWins = m.home_penalties > m.away_penalties;
      awayWins = !homeWins;
    }
  }
  return (
    <div className="card w-full p-3">
      <div className="mb-2 flex items-center justify-between text-[10px] text-zinc-500">
        <span>M{m.id} · {m.date_venue} · {m.times.venue}{!m.time_confirmed && '*'}</span>
        <StatusChip status={m.status} />
      </div>
      <div className="space-y-1.5">
        <Side team={m.home_team} placeholder={m.home_placeholder} score={m.home_score}
          pens={m.home_penalties} winner={finished && homeWins} />
        <Side team={m.away_team} placeholder={m.away_placeholder} score={m.away_score}
          pens={m.away_penalties} winner={finished && awayWins} />
      </div>
      <p className="mt-2 truncate text-[10px] text-zinc-500">
        📍 {m.venue.city}, {m.venue.country}
      </p>
    </div>
  );
}

function Round({ title, matches }: { title: string; matches: MatchView[] }) {
  return (
    <div className="min-w-[230px] flex-1 space-y-3">
      <h3 className="text-center text-[12px] font-bold uppercase tracking-wider text-zinc-400">
        {title}
      </h3>
      <div className="flex h-full flex-col justify-around gap-3">
        {matches.map((m) => (
          <BracketCard key={m.id} m={m} />
        ))}
      </div>
    </div>
  );
}

export default function KnockoutPage() {
  const { data, loading, error, reload } = useFetch<KnockoutData>('/api/knockout');

  if (loading) return <Loading label="Loading knockout bracket…" />;
  if (error || !data) return <ErrorBox message={error ?? 'No data'} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <div className="card p-4 text-[13px] text-zinc-400">
        Placeholders (e.g. <em>Winner Group A</em>, <em>Third place Group C/E/F/H/I</em>) are replaced
        automatically with real teams as groups finish and results come in via{' '}
        <span className="text-zinc-200">Refresh Data</span>.
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[1500px] gap-4">
          <Round title="Round of 32 · Jun 28 – Jul 3" matches={data.r32} />
          <Round title="Round of 16 · Jul 4 – 7" matches={data.r16} />
          <Round title="Quarter-finals · Jul 9 – 11" matches={data.qf} />
          <Round title="Semi-finals · Jul 14 – 15" matches={data.sf} />
          <div className="min-w-[230px] flex-1 space-y-6">
            <Round title="Final · Jul 19 · New York/NJ" matches={data.final} />
            <Round title="Third place · Jul 18 · Miami" matches={data.third} />
          </div>
        </div>
      </div>
      <p className="text-[11px] text-zinc-500">* kickoff time provisional · scroll horizontally to see the full bracket</p>
    </div>
  );
}
