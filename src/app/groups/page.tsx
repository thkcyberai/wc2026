'use client';

import GroupTable from '@/components/GroupTable';
import { ErrorBox, Loading } from '@/components/ui';
import { useFetch } from '@/components/useFetch';
import type { GroupView } from '@/lib/types';

export default function GroupsPage() {
  const { data, loading, error, reload } = useFetch<{ groups: GroupView[] }>('/api/groups');

  if (loading) return <Loading label="Loading group tables…" />;
  if (error || !data) return <ErrorBox message={error ?? 'No data'} onRetry={reload} />;

  return (
    <div className="space-y-5">
      <div className="card p-4 text-[13px] text-zinc-400">
        <span className="font-semibold text-zinc-200">Qualification:</span> top 2 of each group advance
        to the Round of 32, plus the <span className="text-gold">8 best third-placed teams</span> across
        all 12 groups (points → goal difference → goals scored).
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {data.groups.map((g) => (
          <GroupTable key={g.letter} group={g} />
        ))}
      </div>
    </div>
  );
}
