/** Central configuration. Only NEXT_PUBLIC_* values are available in the browser. */
export const PUBLIC_API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1').replace(/\/$/, '');

/** Server-side base URL; can point at an internal address when the frontend and API share a host. */
export const SERVER_API_BASE_URL = (process.env.API_INTERNAL_BASE_URL || PUBLIC_API_BASE_URL).replace(/\/$/, '');

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const CONTENT_REVALIDATE_SECONDS = Number(process.env.CONTENT_REVALIDATE_SECONDS ?? 300);

export const SITE_NAME = 'CARISCA';

/** The CARISCA events portal (registration for CPDs, summits and forums) and its public API. */
export const EVENTS_SITE_URL = (process.env.EVENTS_SITE_URL || 'https://events.carisca.org').replace(/\/$/, '');
export const EVENTS_API_URL = (process.env.EVENTS_API_URL || 'https://events-api.carisca.org/api/v1').replace(/\/$/, '');
