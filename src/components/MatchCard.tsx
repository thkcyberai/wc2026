'use client';

import type { MatchEvent, MatchView } from '@/lib/types';
import { StatusChip } from './ui';
import Flag from './Flag';

function eventIcon(type: MatchEvent['type']): string {
  switch (type) {
    case 'goal': return '⚽';
    case 'penalty': return '⚽ (pen)';
    case 'own-goal': return '⚽ (og)';
    case 'yellow': return '🟨';
    case 'red': return '🟥';
  }
}

function minuteLabel(e: MatchEvent): string {
  if (e.minute === null) return '';
  return `${e.minute}${e.minute_extra ? `+${e.minute_extra}` : ''}'`;
}

function EventList({ events, teamId }: { events: MatchEvent[]; teamId: number | null }) {
  const list = events.filter((e) => e.team_id === teamId);
  if (!list.length) return null;
  return (
    <ul className="space-y-0.5">
      {list.map((e) => (
        <li key={e.id} className="text-[11px] leading-tight text-zinc-400">
          {eventIcon(e.type)} {minuteLabel(e)} {e.player_name}
        </li>
      ))}
    </ul>
  );
}

function TeamLabel({
  team,
  placeholder,
}: {
  team: { code: string; name: string } | null;
  placeholder: string | null;
}) {
  if (team) {
    return (
      <span className="flex items-center gap-2.5">
        <Flag code={team.code} name={team.name} size="md" />
        <span className="font-semibold">{team.name}</span>
      </span>
    );
  }
  return <span className="text-sm italic text-zinc-400">{placeholder ?? 'TBD'}</span>;
}

export default function MatchCard({ match, compact = false }: { match: MatchView; compact?: boolean }) {
  const hasScore = match.home_score !== null && match.away_score !== null;
  const pens =
    match.home_penalties !== null && match.away_penalties !== null
      ? ` (${match.home_penalties}–${match.away_penalties} pens)`
      : '';

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
        <span className="font-semibold uppercase tracking-wide text-zinc-300">
          Match {match.id} · {match.stage_label}
        </span>
        <StatusChip status={match.status} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <TeamLabel team={match.home_team} placeholder={match.home_placeholder} />
          <TeamLabel team={match.away_team} placeholder={match.away_placeholder} />
        </div>
        <div className="text-right">
          {hasScore ? (
            <div className="text-2xl font-extrabold tabular-nums">
              {match.home_score}
              <span className="text-zinc-500"> – </span>
              {match.away_score}
              {pens && <div className="text-[10px] font-medium text-zinc-400">{pens}</div>}
            </div>
          ) : (
            <div className="text-sm font-semibold text-zinc-400">
              {match.times.venue}
              {!match.time_confirmed && <span title="kickoff time provisional">*</span>}
              <div className="text-[10px] font-normal text-zinc-500">venue time</div>
            </div>
          )}
        </div>
      </div>

      {match.events.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-2">
          <EventList events={match.events} teamId={match.home_team_id} />
          <EventList events={match.events} teamId={match.away_team_id} />
        </div>
      )}

      <div className="mt-3 border-t border-white/10 pt-2 text-[12px] text-zinc-400">
        <p className="truncate">
          📍 {match.venue.name} · {match.venue.city}, {match.venue.country}
        </p>
        <p>📅 {match.date_venue}</p>
      </div>

      {!compact && (
        <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-zinc-400 sm:grid-cols-4">
          <span title="Local venue time">🏟️ {match.times.venue}</span>
          <span title="Europe/Lisbon">🇵🇹 Lisboa {match.times.lisboa}</span>
          <span title="America/Denver">🏔️ Colorado {match.times.colorado}</span>
          <span title="America/Sao_Paulo">🇧🇷 Brasil {match.times.brasil}</span>
        </div>
      )}
    </div>
  );
}
