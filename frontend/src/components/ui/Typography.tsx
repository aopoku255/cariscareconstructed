import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { SmartLink } from './SmartLink';

export function SectionHeading({
  eyebrow,
  title,
  intro,
  action,
  id,
  as: Tag = 'h2',
  align = 'left',
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  action?: { href: string; label: string };
  id?: string;
  as?: 'h1' | 'h2' | 'h3';
  align?: 'left' | 'center';
}) {
  return (
    // data-reveal: animates in on pages that mount <ScrollReveal />; inert everywhere else.
    <div data-reveal className={`mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${align === 'center' ? 'text-center md:flex-col md:items-center' : ''}`}>
      <div className={align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-3xl'}>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <Tag id={id} className="text-[1.75rem] leading-tight font-bold md:text-[2.125rem]">
          {title}
        </Tag>
        {intro && <div className="mt-3 text-lg text-muted">{intro}</div>}
      </div>
      {action && (
        <SmartLink href={action.href} className="group inline-flex shrink-0 items-center gap-1.5 font-display font-semibold text-brand-700 hover:text-brand-900">
          {action.label}
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </SmartLink>
      )}
    </div>
  );
}

const BADGE_TONES = {
  brand: 'bg-brand-50 text-brand-800 ring-brand-100',
  sky: 'bg-[#e6f8fe] text-sky-ink ring-[#bfeefc]',
  gold: 'bg-[#f8f1e0] text-gold-ink ring-[#ecdcb5]',
  neutral: 'bg-surface text-muted ring-line',
  success: 'bg-[#e7f5ee] text-success ring-[#c3e6d4]',
  danger: 'bg-[#fdecea] text-danger ring-[#f6c9c4]',
} as const;

export function Badge({ children, tone = 'brand' }: { children: ReactNode; tone?: keyof typeof BADGE_TONES }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold tracking-wide uppercase ring-1 ring-inset ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

/** Renders sanitised CMS HTML (sanitised server-side by the API on save). */
export function RichText({ html, className = '' }: { html: string | null | undefined; className?: string }) {
  if (!html) return null;
  return <div className={`prose-cms ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function EmptyState({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-(--radius-card) border border-dashed border-line bg-surface px-6 py-12 text-center">
      {icon && <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white text-brand-600">{icon}</div>}
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-xl text-muted">{children}</div>}
    </div>
  );
}
