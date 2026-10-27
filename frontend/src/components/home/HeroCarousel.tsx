'use client';

import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Slide } from '@/types/api';
import { ButtonLink } from '../ui/Button';
import { CmsImage } from '../ui/CmsImage';

const INTERVAL_MS = 5000;
const SLIDE_MS = 950;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const SWIPE_PX = 40;
/** Keeps faces in frame when wide photos are cropped to the banner. */
const FOCAL_POINT = 'center 35%';
const REDUCED = '(prefers-reduced-motion: reduce)';
const subscribeReducedMotion = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

/**
 * Homepage hero banner (WAI-ARIA carousel pattern). Slides travel right to left; the track is
 * bookended with copies of the last and first slides so wrapping keeps the same direction, then
 * jumps (invisibly) back to the real slide. Auto-rotation pauses on hover/focus, can be paused by
 * the visitor, and is off when reduced motion is preferred, which also removes the sliding.
 */
export function HeroCarousel({ slides, fallbackTitle, fallbackCaption }: { slides: Slide[]; fallbackTitle: string; fallbackCaption?: string | null }) {
  const items: Slide[] = slides.length
    ? slides
    : [{ id: 0, title: fallbackTitle, caption: fallbackCaption ?? null, image: null, image_alt: null, button_label: 'About CARISCA', button_url: '/about', secondary_label: null, secondary_url: null }];
  const n = items.length;
  const looped = n > 1;
  const track = looped ? [items[n - 1], ...items, items[0]] : items;

  // Position on the track: 1..n are the real slides, 0 and n + 1 the copies.
  const [pos, setPos] = useState(looped ? 1 : 0);
  const [animate, setAnimate] = useState(true);
  const [moving, setMoving] = useState(false);
  const current = looped ? (pos - 1 + n) % n : 0;

  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia(REDUCED).matches, () => false);
  // Visitors who prefer reduced motion get no auto-rotation unless they press play.
  const [userPlaying, setPlaying] = useState<boolean | null>(null);
  const playing = (userPlaying ?? !reducedMotion) && looped;
  const [hovered, setHovered] = useState(false);
  const touchX = useRef<number | null>(null);

  const move = useCallback(
    (target: number) => {
      if (!looped || moving || target === pos) return;
      if (reducedMotion) {
        setAnimate(false);
        setPos(((target - 1 + n) % n) + 1);
        return;
      }
      setAnimate(true);
      setMoving(true);
      setPos(target);
    },
    [looped, moving, pos, reducedMotion, n],
  );

  // When a slide finishes arriving, swap a copy for its real slide without animating.
  useEffect(() => {
    if (!moving) return;
    const t = setTimeout(() => {
      setMoving(false);
      if (pos === 0 || pos === n + 1) {
        setAnimate(false);
        setPos(pos === 0 ? n : 1);
      }
    }, SLIDE_MS + 40);
    return () => clearTimeout(t);
  }, [moving, pos, n]);

  // Restarts whenever the slide changes, so manual navigation resets the timer.
  useEffect(() => {
    if (!playing || hovered || moving) return;
    const t = setTimeout(() => move(pos + 1), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [playing, hovered, moving, pos, move]);

  return (
    <section aria-roledescription="carousel" aria-label="Highlights" className="bg-white pt-4 md:pt-6">
      <div className="mx-auto w-full max-w-(--container-site) px-4 sm:px-6 lg:w-[80vw] lg:px-0">
        <div
          className="relative isolate h-[340px] touch-pan-y overflow-hidden rounded-(--radius-card) bg-brand-950 sm:h-[380px] md:h-[440px] lg:h-[480px] xl:h-[520px]"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocusCapture={() => setHovered(true)}
          onBlurCapture={() => setHovered(false)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > SWIPE_PX) move(pos + (dx < 0 ? 1 : -1));
          }}
        >
          <div aria-live={playing ? 'off' : 'polite'} className="h-full">
            <div
              className="flex h-full"
              style={{
                transform: `translate3d(${-pos * 100}%, 0, 0)`,
                transition: animate ? `transform ${SLIDE_MS}ms ${EASE}` : 'none',
                willChange: 'transform',
              }}
            >
              {track.map((slide, k) => {
                const isCopy = looped && (k === 0 || k === n + 1);
                const real = looped ? (k - 1 + n) % n : k;
                const active = k === pos;
                const Heading = real === 0 && !isCopy ? 'h1' : 'h2';
                return (
                  <div
                    key={isCopy ? `copy-${k}` : slide.id}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${real + 1} of ${n}`}
                    aria-hidden={!active || undefined}
                    inert={!active}
                    className="relative h-full w-full shrink-0"
                  >
                    <div className="absolute inset-0 -z-10">
                      <CmsImage
                        media={slide.image}
                        slot="hero"
                        alt={slide.image_alt}
                        fill
                        priority={real === 0 && !isCopy}
                        eager
                        objectPosition={FOCAL_POINT}
                        sizes="(min-width:1024px) 80vw, 100vw"
                      />
                      <div className="absolute inset-0 bg-linear-to-r from-brand-950/90 via-brand-950/70 to-brand-950/30 md:via-brand-950/60 md:to-brand-950/5" />
                    </div>
                    <div className="flex h-full items-center px-6 pb-12 sm:px-10 md:pb-0 lg:px-14">
                      <div className="max-w-xl">
                        <div className="mb-4 h-1 w-14 bg-sky-accent md:mb-5" aria-hidden />
                        <Heading className="text-[1.65rem] leading-[1.1] font-bold text-white sm:text-[2rem] md:text-[2.6rem]">{slide.title}</Heading>
                        {slide.caption && <p className="mt-3 line-clamp-2 text-base text-brand-100 md:mt-4 md:line-clamp-3 md:text-lg">{slide.caption}</p>}
                        <div className="mt-6 flex flex-wrap gap-3 md:mt-7">
                          {slide.button_label && slide.button_url && (
                            <ButtonLink href={slide.button_url} variant="light" size="lg">
                              {slide.button_label}
                            </ButtonLink>
                          )}
                          {slide.secondary_label && slide.secondary_url && (
                            <ButtonLink href={slide.secondary_url} variant="outline-light" size="lg" className="max-sm:hidden">
                              {slide.secondary_label}
                            </ButtonLink>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {looped && (
            <div className="absolute right-3 bottom-3 flex items-center gap-2 md:right-6 md:bottom-5">
              <button type="button" onClick={() => setPlaying(!playing)} className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30" aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}>
                {playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
              </button>
              <button type="button" onClick={() => move(pos - 1)} className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30" aria-label="Previous slide">
                <ChevronLeft aria-hidden className="size-5" />
              </button>
              <div className="flex gap-1.5 px-1">
                {items.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => move(i + 1)}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === current ? 'true' : undefined}
                    className={`h-2.5 rounded-full transition-all ${i === current ? 'w-7 bg-sky-accent' : 'w-2.5 bg-white/60 hover:bg-white'}`}
                  />
                ))}
              </div>
              <button type="button" onClick={() => move(pos + 1)} className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30" aria-label="Next slide">
                <ChevronRight aria-hidden className="size-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
