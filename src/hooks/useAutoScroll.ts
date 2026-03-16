import { useEffect, useState } from 'react';

export function useAutoScroll(ref: { current: HTMLDivElement | null }, interval = 3000) {
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    let scrollInterval: NodeJS.Timeout;
    if (!isPaused) {
      scrollInterval = setInterval(() => {
        const maxScroll = container.scrollWidth - container.clientWidth;
        const currentScroll = container.scrollLeft;

        if (currentScroll >= maxScroll) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: container.clientWidth, behavior: 'smooth' });
        }
      }, interval);
    }

    return () => {
      if (scrollInterval) clearInterval(scrollInterval);
    };
  }, [ref, interval, isPaused]);

  return {
    onMouseEnter: () => setIsPaused(true),
    onMouseLeave: () => setIsPaused(false),
    onTouchStart: () => setIsPaused(true),
    onTouchEnd: () => setIsPaused(false),
  };
}
