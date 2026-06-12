'use client';

import { useState } from 'react';

/** Player photo with graceful fallback to an initials avatar. */
export default function PlayerPhoto({
  src,
  name,
  size = 64,
}: {
  src: string | null;
  name: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (!src || failed) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full bg-pitch-700 font-bold text-accent ring-1 ring-white/15"
        style={{ width: size, height: size, fontSize: size / 3 }}
        title={name}
      >
        {initials}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      title={name}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full object-cover ring-1 ring-white/15"
      style={{ width: size, height: size }}
    />
  );
}
