'use client';

import { useEffect, useState } from 'react';
import Flag from '@/components/Flag';
import PlayerPhoto from '@/components/PlayerPhoto';
import { ErrorBox, Loading } from '@/components/ui';
import type { Player } from '@/lib/types';

interface TeamRow {
  id: number; code: string; name: string; group_letter: string; player_count: number;
}
interface PlayersData {
  teams: TeamRow[];
  players: Player[];
  totalPlayers: number;
}

const POSITION_LABELS: Record<string, string> = {
  Goalkeeper: 'Goalkeepers', Defender: 'Defenders',
  Midfielder: 'Midfielders', Attacker: 'Attackers',
};

export default function PlayersPage() {
  const [team, setTeam] = useState<string>('');
  const [data, setData] = useState<PlayersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingSquads, setLoadingSquads] = useState(false);
  const [loadMsg, setLoadMsg] = useState<string | null>(null);

  async function fetchData(selected: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/players${selected ? `?team=${selected}` : ''}`, { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setData(body as PlayersData);
      if (!selected && (body as PlayersData).teams.length) {
        // default to first team that has players, else first team
        const t = (body as PlayersData).teams.find((x) => x.player_count > 0) ?? (body as PlayersData).teams[0];
        setTeam(t.code);
        return fetchData(t.code);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData(team);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSquads() {
    setLoadingSquads(true);
    setLoadMsg(null);
    try {
      const res = await fetch('/api/players/load', { method: 'POST' });
      const body = await res.json();
      setLoadMsg(body.message || body.error || 'Done.');
      await fetchData(team);
    } catch (e) {
      setLoadMsg((e as Error).message);
    } finally {
      setLoadingSquads(false);
    }
  }

  if (loading && !data) return <Loading label="Loading squads…" />;
  if (error || !data) return <ErrorBox message={error ?? 'No data'} onRetry={() => fetchData(team)} />;

  const selected = data.teams.find((t) => t.code === team);
  const byPosition = new Map<string, Player[]>();
  for (const p of data.players) {
    const key = POSITION_LABELS[p.position ?? ''] ?? 'Others';
    const list = byPosition.get(key) ?? [];
    list.push(p);
    byPosition.set(key, list);
  }
  const sections = ['Goalkeepers', 'Defenders', 'Midfielders', 'Attackers', 'Others']
    .filter((s) => byPosition.has(s));

  return (
    <div className="space-y-6">
      {data.totalPlayers === 0 && (
        <div className="card space-y-3 p-5">
          <h2 className="font-bold">No squads loaded yet</h2>
          <p className="text-sm text-zinc-400">
            Squad data hasn&apos;t been imported yet. Press the button below to load the 48 national
            squads — it can take a minute.
          </p>
          <button className="btn-primary" onClick={loadSquads} disabled={loadingSquads}>
            {loadingSquads ? 'Loading squads… (can take a minute)' : '⬇️ Load squads'}
          </button>
          {loadMsg && <p className="text-[12px] text-gold">{loadMsg}</p>}
        </div>
      )}

      {/* team selector */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-1.5">
          {data.teams.map((t) => (
            <button
              key={t.code}
              onClick={() => { setTeam(t.code); void fetchData(t.code); }}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-semibold transition ${
                team === t.code ? 'bg-accent text-pitch-950' : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              }`}
              title={`${t.name} (${t.player_count} players)`}
            >
              <Flag code={t.code} name={t.name} size="sm" />
              <span className="hidden sm:inline">{t.code}</span>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="flex items-center gap-3">
          <Flag code={selected.code} name={selected.name} size="md" />
          <h2 className="text-xl font-extrabold">{selected.name}</h2>
          <span className="chip bg-white/10 text-zinc-300">Group {selected.group_letter}</span>
          <span className="text-[12px] text-zinc-500">{data.players.length} players</span>
        </div>
      )}

      {loading && <Loading label="Loading players…" />}

      {!loading && selected && data.players.length === 0 && data.totalPlayers > 0 && (
        <p className="card p-5 text-sm text-zinc-500">
          No squad loaded for {selected.name} yet — run a refresh or the squad loader to top it up.
        </p>
      )}

      {!loading && sections.map((section) => (
        <section key={section}>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-400">{section}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {byPosition.get(section)!.map((p) => (
              <div key={p.id} className="card flex flex-col items-center gap-2 p-4 text-center">
                <PlayerPhoto src={p.photo_url} name={p.name} size={72} />
                <div>
                  <p className="text-sm font-semibold leading-tight">{p.name}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {p.shirt_number ? `#${p.shirt_number} · ` : ''}{p.position ?? ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
