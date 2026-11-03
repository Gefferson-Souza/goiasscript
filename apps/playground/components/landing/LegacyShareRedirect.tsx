'use client';
import { useEffect } from 'react';
import { legacyShareTarget } from '@/lib/landing/legacy-share';

export function LegacyShareRedirect() {
  useEffect(() => {
    const target = legacyShareTarget(window.location.search, window.location.hash);
    if (target !== null) window.location.replace(target);
  }, []);
  return null;
}
