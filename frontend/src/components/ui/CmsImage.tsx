import Image from 'next/image';
import slots from '@/lib/image-slots.json';
import type { Media } from '@/types/api';

export type ImageSlot = keyof typeof slots;

interface Props {
  media?: Media | null;
  slot: ImageSlot;
  /** Overrides the media alt text (e.g. the slide's own alt field). */
  alt?: string | null;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Override the slot's default fit, e.g. "contain" for posters. */
  fit?: 'cover' | 'contain';
  /** Fill the parent (which must be positioned) instead of reserving the slot's aspect ratio. */
  fill?: boolean;
  rounded?: boolean;
  /** Load without preloading, e.g. carousel slides that must be ready before they slide into view. */
  eager?: boolean;
  /** CSS object-position, to keep the subject in frame when the image is cropped. */
  objectPosition?: string;
}

/**
 * Renders an uploaded image in a fixed-ratio frame, or a labelled placeholder with the slot's
 * intended dimensions when no image has been assigned yet. Replacing the image in the dashboard
 * swaps the placeholder without any component change. The frame reserves space to prevent layout shift.
 */
export function CmsImage({ media, slot, alt, sizes = '100vw', priority = false, className = '', fit, fill = false, rounded = false, eager = false, objectPosition }: Props) {
  const s = slots[slot];
  const objectFit = fit ?? (s.fit as 'cover' | 'contain');
  const frameClass = `${fill ? 'absolute inset-0' : 'relative w-full'} overflow-hidden ${rounded ? 'rounded-(--radius-card)' : ''} ${
    objectFit === 'contain' ? 'bg-surface' : 'bg-surface-strong'
  } ${className}`;
  const style = fill ? undefined : { aspectRatio: `${s.width} / ${s.height}` };

  if (!media?.url) {
    return (
      <div className={frameClass} style={style} data-placeholder={slot}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG placeholder */}
        <img
          src={`/images/placeholders/${s.file}`}
          alt={`Image placeholder: ${s.label} (${s.width} × ${s.height} px)`}
          width={s.width}
          height={s.height}
          className="h-full w-full object-cover"
          loading={priority || eager ? 'eager' : 'lazy'}
        />
      </div>
    );
  }

  const text = (alt ?? media.alt_text ?? '').trim();
  return (
    <div className={frameClass} style={style}>
      <Image
        src={media.url}
        alt={text}
        fill
        sizes={sizes}
        preload={priority}
        loading={priority ? undefined : eager ? 'eager' : 'lazy'}
        quality={priority ? 80 : 70}
        className={objectFit === 'contain' ? 'object-contain' : 'object-cover'}
        style={objectPosition ? { objectPosition } : objectFit === 'cover' && slot === 'portrait' ? { objectPosition: 'center 20%' } : undefined}
      />
    </div>
  );
}
