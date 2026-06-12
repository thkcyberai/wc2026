'use client';

import type { GroupView } from '@/lib/types';
import { QualBadge } from './ui';
import Flag from './Flag';
import { useI18n } from './LanguageProvider';

export default function GroupTable({ group }: { group: GroupView }) {
  const { t } = useI18n();
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <h3 className="font-bold">
          {t('group.word')} <span className="text-accent">{group.letter}</span>
        </h3>
        <span className="text-[11px] text-zinc-400">
          {group.complete ? t('group.complete') : t('group.progress')}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-500">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">{t('tbl.team')}</th>
              <th className="px-2 py-2 text-center">{t('tbl.p')}</th>
              <th className="px-2 py-2 text-center">{t('tbl.w')}</th>
              <th className="px-2 py-2 text-center">{t('tbl.d')}</th>
              <th className="px-2 py-2 text-center">{t('tbl.l')}</th>
              <th className="px-2 py-2 text-center">{t('tbl.gf')}</th>
              <th className="px-2 py-2 text-center">{t('tbl.ga')}</th>
              <th className="px-2 py-2 text-center">{t('tbl.gd')}</th>
              <th className="px-2 py-2 text-center">{t('tbl.pts')}</th>
              <th className="px-3 py-2">{t('tbl.status')}</th>
            </tr>
          </thead>
          <tbody>
            {group.standings.map((row) => (
              <tr
                key={row.team_id}
                className={`border-t border-white/5 ${
                  row.position <= 2 ? 'bg-accent/[0.06]' : row.position === 3 ? 'bg-gold/[0.05]' : ''
                }`}
              >
                <td className="px-3 py-2 font-mono text-zinc-400">{row.position}</td>
                <td className="px-3 py-2">
                  <span className="flex items-center gap-2">
                    <Flag code={row.team.code} name={row.team.name} size="sm" />
                    <span className="font-semibold">{row.team.name}</span>
                  </span>
                </td>
                <td className="px-2 py-2 text-center tabular-nums">{row.played}</td>
                <td className="px-2 py-2 text-center tabular-nums">{row.won}</td>
                <td className="px-2 py-2 text-center tabular-nums">{row.drawn}</td>
                <td className="px-2 py-2 text-center tabular-nums">{row.lost}</td>
                <td className="px-2 py-2 text-center tabular-nums">{row.goals_for}</td>
                <td className="px-2 py-2 text-center tabular-nums">{row.goals_against}</td>
                <td className="px-2 py-2 text-center tabular-nums">
                  {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                </td>
                <td className="px-2 py-2 text-center font-bold tabular-nums">{row.points}</td>
                <td className="px-3 py-2">
                  <QualBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
