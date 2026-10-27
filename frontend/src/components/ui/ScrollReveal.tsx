'use client';

import { useEffect } from 'react';

const STAGGER_MS = 90;
const MAX_STAGGER_MS = 450;

/**
 * Fades and lifts page content into view as it is scrolled to. Mark elements with `data-reveal`,
 * or a container with `data-reveal-stagger` to reveal its children one after another.
 * Content that is already on screen, or everything when reduced motion is preferred, is left alone.
 */
export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

    const targets: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => targets.push(el));
    document.querySelectorAll<HTMLElement>('[data-reveal-stagger]').forEach((parent) => {
      Array.from(parent.children).forEach((child, i) => {
        const el = child as HTMLElement;
        el.style.setProperty('--reveal-delay', `${Math.min(i * STAGGER_MS, MAX_STAGGER_MS)}ms`);
        targets.push(el);
      });
    });

    const finish = (el: HTMLElement) => {
      el.classList.remove('reveal-pending', 'reveal-in');
      el.style.removeProperty('--reveal-delay');
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          observer.unobserve(el);
          el.classList.add('reveal-in');
          el.classList.remove('reveal-pending');
          // Drop the reveal styles once the longest delay + transition is over, so they never
          // interfere with hover transitions on the element.
          setTimeout(() => finish(el), MAX_STAGGER_MS + 1000);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    for (const el of targets) {
      // Never hide what the visitor can already see, and let nested targets move with their parent.
      if (el.getBoundingClientRect().top < window.innerHeight) continue;
      if (targets.some((other) => other !== el && other.contains(el))) continue;
      el.classList.add('reveal-pending');
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
      targets.forEach(finish);
    };
  }, []);

  return null;
}
