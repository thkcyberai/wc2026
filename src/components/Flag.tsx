'use client';

import { useState } from 'react';
import { FLAG_CODES } from '@/lib/flags';

/**
 * Country flag image (flagcdn.com, retina-aware).
 * Falls back to a small code badge if the image can't load (e.g. offline).
 * Sizes: sm = tables/bracket, md = match cards.
 */
export default function Flag({
  code,
  name,
  size = 'md',
}: {
  code: string;        // FIFA trigram, e.g. 'MEX'
  name?: string;       // for alt/tooltip
  size?: 'sm' | 'md';
}) {
  const [failed, setFailed] = useState(false);
  const iso = FLAG_CODES[code];

  const dims = size === 'md'
    ? { w: 30, h: 20, cls: 'h-5 w-[30px]' }
    : { w: 24, h: 16, cls: 'h-4 w-6' };

  if (!iso || failed) {
    return (
      <span
        className={`inline-flex ${dims.cls} shrink-0 items-center justify-center rounded-[3px] bg-white/10 font-mono text-[9px] text-zinc-300`}
        title={name ?? code}
      >
        {code}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      srcSet={`https://flagcdn.com/w80/${iso}.png 2x`}
      width={dims.w}
      height={dims.h}
      alt={`${name ?? code} flag`}
      title={name ?? code}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${dims.cls} shrink-0 rounded-[3px] object-cover ring-1 ring-white/20`}
    />
  );
}
