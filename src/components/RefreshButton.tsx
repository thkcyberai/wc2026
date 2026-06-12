'use client';

import { useState } from 'react';
import { useI18n } from './LanguageProvider';

interface PublicRefreshResult {
  ok: boolean;
  matchesUpdated: number;
  ranAt: string;
  message: string;
}

export default function RefreshButton({ onDone }: { onDone?: () => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PublicRefreshResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/refresh', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Refresh is unavailable right now.');
      setResult(data as PublicRefreshResult);
      onDone?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button className="btn-primary w-full sm:w-auto" onClick={refresh} disabled={busy}>
        {busy ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-pitch-950/40 border-t-pitch-950" />
            {t('refresh.busy')}
          </>
        ) : (
          <>{t('refresh.btn')}</>
        )}
      </button>
      {result && (
        <p className={`text-[12px] ${result.ok ? 'text-accent' : 'text-gold'}`}>
          {result.ok ? t('refresh.ok', { n: result.matchesUpdated }) : t('refresh.fail')}
        </p>
      )}
      {error && <p className="text-[12px] text-red-300">{error}</p>}
    </div>
  );
}
