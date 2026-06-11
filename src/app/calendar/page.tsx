'use client';

import { useMemo, useState } from 'react';
import MatchCard from '@/components/MatchCard';
import { ErrorBox, Loading } from '@/components/ui';
import { useFetch } from '@/components/useFetch';
import type { MatchView } from '@/lib/types';

const STAGES = [
  { value: '', label: 'All stages' },
  { value: 'GROUP', label: 'Group stage' },
  { value: 'R32', label: 'Round of 32' },
  { value: 'R16', label: 'Round of 16' },
  { value: 'QF', label: 'Quarter-finals' },
  { value: 'SF', label: 'Semi-finals' },
  { value: 'THIRD', label: 'Third-place match' },
  { value: 'FINAL', label: 'Final' },
];

export default function CalendarPage() {
  const { data, loading, error, reload } = useFetch<{ matches: MatchView[] }>('/api/matches');

  const [q, setQ] = useState('');
  const [team, setTeam] = useState('');
  const [group, setGroup] = useState('');
  const [venue, setVenue] = useState('');
  const [stage, setStage] = useState('');
  const [date, setDate] = useState('');
  const [country, setCountry] = useState('');

  const all = useMemo(() => data?.matches ?? [], [data]);

  const teams = useMemo(() => {
    const s = new Map<string, string>();
    all.forEach((m) => {
      if (m.home_team) s.set(m.home_team.code, m.home_team.name);
      if (m.away_team) s.set(m.away_team.code, m.away_team.name);
    });
    return [...s.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [all]);

  const venues = useMemo(() => {
    const s = new Map<string, string>();
    all.forEach((m) => s.set(m.venue.key, `${m.venue.name} (${m.venue.city})`));
    return [...s.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [all]);

  const dates = useMemo(
    () => [...new Set(all.map((m) => m.date_venue))].sort(),
    [all]
  );

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return all.filter((m) => {
      if (team && m.home_team?.code !== team && m.away_team?.code !== team) return false;
      if (group && m.group_letter !== group) return false;
      if (venue && m.venue.key !== venue) return false;
      if (stage && m.stage !== stage) return false;
      if (date && m.date_venue !== date) return false;
      if (country && m.venue.country !== country) return false;
      if (ql) {
        const hay = [
          m.home_team?.name, m.away_team?.name,
          m.home_placeholder, m.away_placeholder,
          m.venue.name, m.venue.city, m.stage_label, `match ${m.id}`,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
  }, [all, q, team, group, venue, stage, date, country]);

  const byDate = useMemo(() => {
    const map = new Map<string, MatchView[]>();
    filtered.forEach((m) => {
      const list = map.get(m.date_venue) ?? [];
      list.push(m);
      map.set(m.date_venue, list);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  if (loading) return <Loading label="Loading all 104 matches…" />;
  if (error || !data) return <ErrorBox message={error ?? 'No data'} onRetry={reload} />;

  const reset = () => {
    setQ(''); setTeam(''); setGroup(''); setVenue(''); setStage(''); setDate(''); setCountry('');
  };

  return (
    <div className="space-y-6">
      <div className="card space-y-3 p-4">
        <input
          className="input w-full"
          placeholder="🔍 Search team, venue, city, stage, match number…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <select className="input" value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="">All teams</option>
            {teams.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
          <select className="input" value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">All groups</option>
            {'ABCDEFGHIJKL'.split('').map((g) => (
              <option key={g} value={g}>Group {g}</option>
            ))}
          </select>
          <select className="input" value={venue} onChange={(e) => setVenue(e.target.value)}>
            <option value="">All venues</option>
            {venues.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select className="input" value={stage} onChange={(e) => setStage(e.target.value)}>
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select className="input" value={date} onChange={(e) => setDate(e.target.value)}>
            <option value="">All dates</option>
            {dates.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">All countries</option>
            <option value="USA">USA</option>
            <option value="Canada">Canada</option>
            <option value="Mexico">Mexico</option>
          </select>
        </div>
        <div className="flex items-center justify-between text-[12px] text-zinc-400">
          <span>
            {filtered.length} of {all.length} matches
            {filtered.some((m) => !m.time_confirmed) && ' · * kickoff time provisional'}
          </span>
          <button className="text-accent hover:underline" onClick={reset}>Clear filters</button>
        </div>
      </div>

      {byDate.length === 0 && (
        <p className="card p-6 text-center text-sm text-zinc-500">No matches found for these filters.</p>
      )}

      {byDate.map(([d, matches]) => (
        <section key={d}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-400">
            {new Date(`${d}T12:00:00`).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
