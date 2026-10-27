import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, Clock, ExternalLink, FileText, MapPin, Monitor, Ticket, Users } from 'lucide-react';
import {
  ARTICLE_TYPE_LABELS,
  DELIVERY_LABELS,
  EVENT_TYPE_LABELS,
  PUBLICATION_TYPE_LABELS,
  formatDate,
  formatDateRange,
  formatShortDate,
  truncate,
} from '@/lib/format';
import type { PortalEvent } from '@/services/events-portal';
import type { ArticleSummary, CpdSession, EventItem, Newsletter, Publication, ResearchProject, StaffMember } from '@/types/api';
import { CmsImage } from '../ui/CmsImage';
import { Badge } from '../ui/Typography';

const cardBase = 'group relative flex flex-col overflow-hidden rounded-(--radius-card) border border-line bg-white shadow-(--shadow-card) transition hover:border-brand-200 hover:shadow-(--shadow-raised)';
/** Makes the whole card clickable via the title link while keeping one link per card for screen readers. */
const stretched = 'after:absolute after:inset-0 after:content-[""] focus-visible:outline-none';

export function ArticleCard({ article, headingLevel = 'h3' }: { article: ArticleSummary; headingLevel?: 'h2' | 'h3' }) {
  const H = headingLevel;
  const category = article.categories?.[0]?.name ?? ARTICLE_TYPE_LABELS[article.type];
  return (
    <article className={`${cardBase} focus-within:ring-3 focus-within:ring-sky-accent/60`}>
      <CmsImage media={article.featuredImage} slot="newsThumb" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Badge tone="sky">{category}</Badge>
          <time dateTime={article.published_at} className="meta">
            {formatShortDate(article.published_at)}
          </time>
        </div>
        <H className="mt-3 text-[1.15rem] leading-snug font-bold">
          <Link href={`/news/${article.slug}`} className={`group-hover:text-brand-700 ${stretched}`}>
            {article.title}
          </Link>
        </H>
        {article.excerpt && <p className="mt-2 line-clamp-3 text-[0.95rem] text-muted">{article.excerpt}</p>}
        <span className="mt-auto pt-4 font-display text-sm font-semibold text-brand-700" aria-hidden>
          Read more →
        </span>
      </div>
    </article>
  );
}

/** Compact dated list item, used for announcements and secondary news lists. */
export function ArticleListItem({ article }: { article: ArticleSummary }) {
  return (
    <article className="group relative flex gap-4 border-b border-line py-4 last:border-b-0">
      <time dateTime={article.published_at} className="flex w-14 shrink-0 flex-col items-center rounded bg-brand-50 py-2 text-center font-display text-brand-800">
        <span className="text-xl leading-none font-bold">{new Date(article.published_at).getUTCDate()}</span>
        <span className="mt-1 text-xs font-semibold uppercase">{formatDate(article.published_at, { day: undefined, year: undefined, month: 'short' })}</span>
        <span className="text-[0.7rem] text-muted">{new Date(article.published_at).getUTCFullYear()}</span>
      </time>
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-sky-ink uppercase">{ARTICLE_TYPE_LABELS[article.type]}</p>
        <h3 className="mt-1 text-base leading-snug font-semibold">
          <Link href={`/news/${article.slug}`} className={`group-hover:text-brand-700 group-hover:underline ${stretched}`}>
            {article.title}
          </Link>
        </h3>
        {article.deadline_at && <p className="mt-1 text-sm font-medium text-danger">Deadline: {formatDate(article.deadline_at)}</p>}
      </div>
    </article>
  );
}

export function PublicationCard({ publication, layout = 'vertical' }: { publication: Publication; layout?: 'vertical' | 'horizontal' }) {
  const p = publication;
  if (layout === 'horizontal') {
    return (
      <article className={`${cardBase} flex-row`}>
        <div className="w-28 shrink-0 sm:w-36">
          <CmsImage media={p.coverImage} slot="publicationCover" sizes="144px" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{PUBLICATION_TYPE_LABELS[p.type]}</Badge>
            {p.publication_year && <span className="meta">{p.publication_year}</span>}
          </div>
          <h3 className="mt-2 text-[1.1rem] leading-snug font-bold">
            <Link href={`/publications/${p.slug}`} className={`group-hover:text-brand-700 ${stretched}`}>
              {p.title}
            </Link>
          </h3>
          {p.authors && <p className="mt-1 text-sm text-muted">{p.authors}</p>}
          {p.abstract && <p className="mt-2 line-clamp-2 text-[0.95rem] text-muted">{p.abstract}</p>}
          <p className="mt-auto flex items-center gap-1.5 pt-3 text-sm font-semibold text-brand-700">
            <FileText aria-hidden className="size-4" />
            {p.file ? 'PDF available' : p.external_url ? 'External publication' : 'Details'}
          </p>
        </div>
      </article>
    );
  }
  return (
    <article className={cardBase}>
      <CmsImage media={p.coverImage} slot="publicationCover" sizes="(min-width:1024px) 25vw, 50vw" />
      <div className="flex flex-1 flex-col p-4">
        <Badge>{PUBLICATION_TYPE_LABELS[p.type]}</Badge>
        <h3 className="mt-2 text-base leading-snug font-bold">
          <Link href={`/publications/${p.slug}`} className={`group-hover:text-brand-700 ${stretched}`}>
            {truncate(p.title, 110)}
          </Link>
        </h3>
        {p.publication_year && <p className="meta mt-auto pt-2">{p.publication_year}</p>}
      </div>
    </article>
  );
}

export function EventCard({ event, compact = false }: { event: EventItem; compact?: boolean }) {
  const e = event;
  return (
    <article className={`${cardBase} ${compact ? '' : 'md:flex-row'}`}>
      <div className={compact ? '' : 'md:w-2/5 md:shrink-0'}>
        <CmsImage media={e.image} slot="eventBanner" sizes="(min-width:768px) 40vw, 100vw" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="gold">{EVENT_TYPE_LABELS[e.event_type]}</Badge>
          {e.location_type !== 'in_person' && <Badge tone="neutral">{DELIVERY_LABELS[e.location_type]}</Badge>}
        </div>
        <h3 className="mt-3 text-[1.15rem] leading-snug font-bold">
          <Link href={`/events/${e.slug}`} className={`group-hover:text-brand-700 ${stretched}`}>
            {e.title}
          </Link>
        </h3>
        <ul className="mt-3 space-y-1.5 text-[0.95rem] text-muted">
          <li className="flex gap-2">
            <CalendarDays aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" />
            <time dateTime={e.starts_at}>{formatDateRange(e.starts_at, e.ends_at, e.all_day)}</time>
          </li>
          {e.venue && (
            <li className="flex gap-2">
              {e.location_type === 'online' ? (
                <Monitor aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" />
              ) : (
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" />
              )}
              {e.venue}
            </li>
          )}
        </ul>
        {!compact && e.summary && <p className="mt-3 line-clamp-2 text-[0.95rem] text-muted">{e.summary}</p>}
      </div>
    </article>
  );
}

/** An upcoming event from the events portal; the card links out to its registration page. */
export function PortalEventCard({ event }: { event: PortalEvent }) {
  const e = event;
  return (
    <article className={cardBase}>
      {e.bannerUrl ? (
        <div className="relative w-full overflow-hidden bg-surface" style={{ aspectRatio: '1200 / 630' }}>
          {/* Served straight from the events portal: no image-host allow-list to keep in sync, so a
              changed portal address can never break the page. */}
          <Image src={e.bannerUrl} alt="" fill unoptimized loading="lazy" className="object-contain" />
        </div>
      ) : (
        <CmsImage media={null} slot="eventBanner" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          {e.typeName && <Badge tone="gold">{e.typeName}</Badge>}
          {e.registrationOpen && <Badge tone="success">Registration open</Badge>}
        </div>
        <h3 className="mt-3 text-[1.15rem] leading-snug font-bold">
          <a href={e.url} target="_blank" rel="noopener noreferrer" className={`group-hover:text-brand-700 ${stretched}`}>
            {e.title}
            <span className="sr-only"> (opens the events portal in a new tab)</span>
          </a>
        </h3>
        <ul className="mt-3 space-y-1.5 text-[0.95rem] text-muted">
          <li className="flex gap-2">
            <CalendarDays aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" />
            <time dateTime={e.startAt}>{formatDateRange(e.startAt, e.endAt)}</time>
          </li>
          {e.where && (
            <li className="flex gap-2">
              {e.online ? <Monitor aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" /> : <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" />}
              {e.where}
            </li>
          )}
          {e.fee && (
            <li className="flex gap-2">
              <Ticket aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" />
              {e.fee}
            </li>
          )}
        </ul>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 font-display text-sm font-semibold text-brand-700" aria-hidden>
          View details &amp; register <ExternalLink className="size-3.5" />
        </span>
      </div>
    </article>
  );
}

export function StaffCard({ person }: { person: StaffMember }) {
  const inner = (
    <>
      <CmsImage media={person.photo} slot="portrait" alt={person.photo ? `Portrait of ${person.name}` : undefined} sizes="(min-width:1024px) 20vw, (min-width:640px) 33vw, 50vw" />
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base leading-snug font-bold text-ink">{person.name}</h3>
        {person.position && <p className="mt-1 text-sm text-muted">{person.position}</p>}
      </div>
    </>
  );
  return (
    <article className={`${cardBase} w-full`}>
      {person.has_profile ? (
        <Link href={`/about/team/${person.slug}`} className="flex flex-1 flex-col focus-visible:ring-3 focus-visible:ring-sky-accent" aria-label={`${person.name}${person.position ? `, ${person.position}` : ''} – view profile`}>
          {inner}
        </Link>
      ) : (
        inner
      )}
    </article>
  );
}

export function ProjectCard({ project }: { project: ResearchProject }) {
  return (
    <article className={`${cardBase} p-6`}>
      <div className="flex flex-wrap items-center gap-2">
        {project.programme && <Badge tone="sky">{project.programme}</Badge>}
        <Badge tone={project.project_status === 'completed' ? 'neutral' : 'success'}>{project.project_status}</Badge>
        {project.theme && <span className="meta">{project.theme.name}</span>}
      </div>
      <h3 className="mt-3 text-[1.15rem] leading-snug font-bold">
        <Link href={`/research/projects/${project.slug}`} className={`group-hover:text-brand-700 ${stretched}`}>
          {project.title}
        </Link>
      </h3>
      {project.lead_researchers && (
        <p className="mt-3 flex gap-2 text-sm text-muted">
          <Users aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" />
          {project.lead_researchers}
        </p>
      )}
    </article>
  );
}

export function NewsletterCard({ issue }: { issue: Newsletter }) {
  return (
    <article className={cardBase}>
      <CmsImage media={issue.coverImage} slot="newsletterCover" sizes="(min-width:1024px) 25vw, 50vw" />
      <div className="flex flex-1 flex-col p-4">
        {issue.issue_number && <p className="eyebrow">Issue {issue.issue_number}</p>}
        <h3 className="mt-1 text-base leading-snug font-bold">
          <Link href={`/newsletters/${issue.slug}`} className={`group-hover:text-brand-700 ${stretched}`}>
            {issue.title}
          </Link>
        </h3>
        {issue.published_on && <p className="meta mt-auto pt-2">{formatDate(issue.published_on, { day: undefined })}</p>}
      </div>
    </article>
  );
}

export function CpdSessionCard({ session }: { session: CpdSession }) {
  const p = session.programme;
  if (!p) return null;
  return (
    <article className={cardBase}>
      <CmsImage media={p.image} slot="training" sizes="(min-width:1024px) 33vw, 100vw" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone={session.registration_status === 'open' ? 'success' : 'neutral'}>
            {session.registration_status === 'open' ? 'Registration open' : session.registration_status}
          </Badge>
          <Badge tone="neutral">{DELIVERY_LABELS[session.delivery_mode]}</Badge>
        </div>
        <h3 className="mt-3 text-[1.15rem] leading-snug font-bold">
          <Link href={`/training/cpd/${p.slug}`} className={`group-hover:text-brand-700 ${stretched}`}>
            {p.title}
          </Link>
        </h3>
        <p className="mt-2 flex gap-2 text-[0.95rem] text-muted">
          <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" />
          {formatDateRange(session.starts_at, session.ends_at)}
        </p>
        {session.fee_text && <p className="mt-1 text-sm text-muted">Fee: {session.fee_text}</p>}
      </div>
    </article>
  );
}
