'use client';

import GroupTable from '@/components/GroupTable';
import { ErrorBox, Loading } from '@/components/ui';
import { useFetch } from '@/components/useFetch';
import { useI18n } from '@/components/LanguageProvider';
import type { GroupView } from '@/lib/types';

export default function GroupsPage() {
  const { data, loading, error, reload } = useFetch<{ groups: GroupView[] }>('/api/groups');
  const { t } = useI18n();

  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox message={error ?? 'No data'} onRetry={reload} />;

  return (
    <div className="space-y-5">
      <div className="card p-4 text-[13px] text-zinc-400">{t('groups.rule')}</div>
      <div className="grid gap-5 lg:grid-cols-2">
        {data.groups.map((g) => (
          <GroupTable key={g.letter} group={g} />
        ))}
      </div>
    </div>
  );
}
