import 'server-only';
import { EVENTS_API_URL, EVENTS_SITE_URL } from '@/lib/config';

/** Upcoming events are refreshed from the events portal at most this often. */
const REVALIDATE_SECONDS = 600;

/** The subset of the events portal's public event record that the website uses. */
interface PortalEventRecord {
  id: string;
  slug: string;
  type?: { key: string; name: string } | null;
  title: string;
  shortDescription?: string | null;
  startAt: string;
  endAt?: string | null;
  deliveryMode?: 'ONLINE' | 'IN_PERSON' | 'HYBRID' | string | null;
  location?: { city?: string | null; country?: string | null; venue?: string | null } | null;
  status?: string | null;
  banner?: { url: string; visibility?: string } | null;
  prices?: Array<{ money: { amountMinor: number; currency: string; formatted: string } }> | null;
}

export interface PortalEvent {
  id: string;
  title: string;
  typeName: string | null;
  summary: string | null;
  startAt: string;
  endAt: string | null;
  online: boolean;
  where: string | null;
  fee: string | null;
  registrationOpen: boolean;
  bannerUrl: string | null;
  url: string;
}

/** Lowest price, preferring Ghana cedis when the event is priced in several currencies. */
function lowestFee(prices: PortalEventRecord['prices']) {
  if (!prices?.length) return null;
  const ghs = prices.filter((p) => p.money.currency === 'GHS');
  const pool = ghs.length ? ghs : prices.filter((p) => p.money.currency === prices[0].money.currency);
  const min = pool.reduce((a, b) => (b.money.amountMinor < a.money.amountMinor ? b : a));
  if (min.money.amountMinor === 0) return 'Free';
  return `${pool.length > 1 ? 'From ' : ''}${min.money.currency} ${min.money.formatted}`;
}

function toPortalEvent(e: PortalEventRecord): PortalEvent {
  const online = e.deliveryMode === 'ONLINE';
  const place = [e.location?.venue, e.location?.city, e.location?.country].filter(Boolean).join(', ');
  const where = online ? 'Online' : [place, e.deliveryMode === 'HYBRID' ? 'In person & online' : ''].filter(Boolean).join(' · ');
  return {
    id: e.id,
    title: e.title,
    typeName: e.type?.name ?? null,
    summary: e.shortDescription ?? null,
    startAt: e.startAt,
    endAt: e.endAt ?? null,
    online,
    where: where || null,
    fee: lowestFee(e.prices),
    registrationOpen: e.status === 'REGISTRATION_OPEN',
    bannerUrl: e.banner?.url && e.banner.visibility !== 'PRIVATE' ? `${EVENTS_API_URL}${e.banner.url}` : null,
    url: `${EVENTS_SITE_URL}/events/${encodeURIComponent(e.slug)}`,
  };
}

/**
 * Upcoming events from the events portal, soonest first. Returns null when the portal cannot be
 * reached, so the homepage can still render and point visitors to the portal instead.
 */
export async function getUpcomingPortalEvents(limit = 3): Promise<PortalEvent[] | null> {
  try {
    const res = await fetch(`${EVENTS_API_URL}/events?limit=12`, {
      headers: { accept: 'application/json' },
      next: { revalidate: REVALIDATE_SECONDS, tags: ['portal-events'] },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: PortalEventRecord[] };
    const now = Date.now();
    return (body.data ?? [])
      .filter((e) => new Date(e.endAt ?? e.startAt).getTime() >= now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, limit)
      .map(toPortalEvent);
  } catch {
    return null;
  }
}
