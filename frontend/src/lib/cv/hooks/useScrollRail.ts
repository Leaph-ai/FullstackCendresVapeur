import { useEffect, useRef } from 'react';

export function useScrollRail() {
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    let ticking = false;

    const update = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      const docH = document.documentElement.scrollHeight;
      rail.style.setProperty('--rot', (y * 0.33).toFixed(1));
      rail.style.setProperty('--chain', (-y).toFixed(0));
      rail.style.setProperty('--chain-height', `${docH}px`);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    const onResize = () => {
      update();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    update();

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(document.documentElement);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      resizeObserver.disconnect();
    };
  }, []);

  return railRef;
}
