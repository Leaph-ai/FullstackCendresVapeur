import { useCallback, useEffect, useRef, useState } from 'react';

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function usePanelReveal(panelIds: string[]) {
  const [locked, setLocked] = useState<Set<string>>(() =>
    REDUCED_MOTION ? new Set(panelIds) : new Set(),
  );
  const [clanking, setClanking] = useState<Set<string>>(new Set());
  const revealedRef = useRef<Set<string>>(new Set());

  const reveal = useCallback((id: string) => {
    if (revealedRef.current.has(id)) return;
    revealedRef.current.add(id);
    setLocked((prev) => new Set(prev).add(id));

    if (!REDUCED_MOTION) {
      window.setTimeout(() => {
        setClanking((prev) => new Set(prev).add(id));
        window.setTimeout(() => {
          setClanking((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 600);
      }, 850);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('anim-ready');

    if (REDUCED_MOTION) return;

    const elements = panelIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target.id);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    elements.forEach((el) => observer.observe(el));

    const fallback = window.setTimeout(() => {
      const canScroll = document.documentElement.scrollHeight > window.innerHeight + 80;

      if (!canScroll) {
        panelIds.forEach(reveal);
        return;
      }

      elements.forEach((el) => {
        const { top, bottom } = el.getBoundingClientRect();
        const visible = top < window.innerHeight * 0.88 && bottom > 0;
        if (visible) reveal(el.id);
      });
    }, 2400);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [panelIds, reveal]);

  const isLocked = (id: string) => locked.has(id);
  const isClanking = (id: string) => clanking.has(id);

  return { isLocked, isClanking };
}
