import Link from 'next/link';
import { CalendarX } from 'lucide-react';
import { EventCard, PortalEventCard } from '@/components/cards/Cards';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar, ResultCount, firstParam, pageParam } from '@/components/ui/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { SmartLink } from '@/components/ui/SmartLink';
import { EmptyState } from '@/components/ui/Typography';
import { EVENTS_SITE_URL } from '@/lib/config';
import { EVENT_TYPE_LABELS } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import { getUpcomingPortalEvents } from '@/services/events-portal';
import { getEvents, getSite } from '@/services/public';
import type { EventType } from '@/types/api';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = buildMetadata({
  title: 'Events & Conferences',
  description: 'Upcoming and past CARISCA events: Supply Chain Research Summits, workshops, Distinguished Lecture Series, CPD training and stakeholder meetings.',
  path: '/events',
});

export default async function EventsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const when = firstParam(sp.when) === 'past' ? 'past' : 'upcoming';
  const page = pageParam(sp.page);
  const type = firstParam(sp.type) as EventType | undefined;
  const q = firstParam(sp.q)?.slice(0, 200);
  const year = Number(firstParam(sp.year)) || undefined;
  // Upcoming events live on the events portal (registration); the past archive stays in this site's CMS.
  const [list, portalEvents, { settings }] = await Promise.all([
    when === 'past' ? getEvents({ when, page, pageSize: 10, type, q, year }) : null,
    when === 'upcoming' ? getUpcomingPortalEvents(12) : null,
    getSite(),
  ]);
  const now = new Date().getUTCFullYear();

  const tab = (value: 'upcoming' | 'past', label: string) => (
    <Link
      href={value === 'upcoming' ? '/events' : '/events?when=past'}
      aria-current={when === value ? 'page' : undefined}
      className={`-mb-px border-b-3 px-4 py-3 font-display text-lg font-semibold ${when === value ? 'border-brand-700 text-brand-800' : 'border-transparent text-muted hover:text-brand-700'}`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHeader title="Events & Conferences" eyebrow="News & events" intro="Summits, workshops, lectures, training and stakeholder engagements." crumbs={[{ label: 'Events' }]} />
      <div className="container-site py-12 md:py-16">
        <nav aria-label="Event listings" className="mb-8 flex gap-2 border-b border-line">
          {tab('upcoming', 'Upcoming')}
          {tab('past', 'Past events')}
        </nav>
        {when === 'past' && (
          <FilterBar
            action="/events"
            q={q}
            searchLabel="Search past events"
            hidden={{ when: 'past' }}
            selects={[
              {
                name: 'type',
                label: 'Type',
                value: type,
                allLabel: 'All types',
                options: Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
              },
              {
                name: 'year',
                label: 'Year',
                value: year ? String(year) : undefined,
                allLabel: 'Any year',
                options: Array.from({ length: now - 2019 }, (_, i) => String(now - i)).map((y) => ({ value: y, label: y })),
              },
            ]}
          />
        )}
        {list && <ResultCount {...list.meta} noun="events" />}
        {list?.data.length ? (
          <div className="grid gap-6">
            {list.data.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        ) : portalEvents?.length ? (
          <>
            <p className="mb-6 text-muted">
              Registration for CARISCA events is handled on the{' '}
              <SmartLink href={`${EVENTS_SITE_URL}/events`} className="link">
                CARISCA events portal
              </SmartLink>
              .
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {portalEvents.map((e) => (
                <PortalEventCard key={e.id} event={e} />
              ))}
            </div>
          </>
        ) : when === 'upcoming' ? (
          <EmptyState title={portalEvents ? 'There are no upcoming events at the moment.' : 'Upcoming events could not be loaded right now.'} icon={<CalendarX className="size-6" />}>
            <p>
              Visit the{' '}
              <SmartLink href={`${EVENTS_SITE_URL}/events`} className="link">
                CARISCA events portal
              </SmartLink>
              , browse the <Link href="/events?when=past" className="link">past events archive</Link>
              {settings.summit_url && (
                <>
                  , or visit the{' '}
                  <SmartLink href={settings.summit_url} className="link">
                    {settings.summit_label ?? 'Summit'} website
                  </SmartLink>
                </>
              )}
              .
            </p>
          </EmptyState>
        ) : (
          <EmptyState title="No past events match these filters." />
        )}
        {list && <Pagination meta={list.meta} basePath="/events" params={{ when: when === 'past' ? 'past' : undefined, type, q, year: year ? String(year) : undefined }} />}
      </div>
    </>
  );
}
