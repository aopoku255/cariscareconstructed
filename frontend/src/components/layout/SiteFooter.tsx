import Image from 'next/image';
import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import type { SiteData } from '@/types/api';
import { NewsletterForm } from '../forms/NewsletterForm';
import { SmartLink } from '../ui/SmartLink';

/** Brand marks (Simple Icons, 24×24 viewBox); lucide no longer ships brand icons. */
const SOCIALS: Array<{ key: string; label: string; path: string }> = [
  {
    key: 'social_facebook',
    label: 'Facebook',
    path: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
  },
  {
    key: 'social_linkedin',
    label: 'LinkedIn',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    key: 'social_whatsapp',
    label: 'WhatsApp community',
    path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
  },
  {
    key: 'social_x',
    label: 'X (Twitter)',
    path: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  },
  {
    key: 'social_youtube',
    label: 'YouTube',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
];

export function SiteFooter({ site }: { site: SiteData }) {
  const s = site.settings;
  const columns = site.menus.footer ?? [];
  const socials = SOCIALS.filter((x) => s[x.key]);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto">
      {/* Newsletter band */}
      <section aria-labelledby="newsletter-heading" className="bg-brand-700 text-white">
        <div className="container-site grid gap-8 py-12 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div>
            <p className="font-display text-sm font-semibold tracking-[0.14em] text-sky-accent uppercase">Stay informed</p>
            <h2 id="newsletter-heading" className="mt-2 text-[1.75rem] font-bold text-white">
              Subscribe to the CARISCA Newsletter
            </h2>
            <p className="mt-2 max-w-lg text-brand-100">
              Research, LMI releases, CPD programmes, events and news from CARISCA, delivered to your inbox.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>

      <div className="bg-brand-950 text-brand-100">
        <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)_1.4fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Image src="/brand/carisca-wordmark-white.png" alt={s.site_name ?? 'CARISCA'} width={601} height={101} className="h-9 w-auto" />
            <p className="mt-3 font-display text-sm font-semibold text-white">{s.site_full_name}</p>
            <p className="mt-4 text-[0.95rem] leading-relaxed">{s.site_description}</p>
            {s.support_text && <p className="mt-4 text-sm text-brand-200">{s.support_text}</p>}
            {socials.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="CARISCA on social media">
                {socials.map((x) => (
                  <li key={x.key}>
                    <a
                      href={s[x.key]!}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={x.label}
                      className="inline-flex size-9 items-center justify-center rounded border border-white/20 text-white hover:border-sky-accent hover:text-sky-accent"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-4">
                        <path d={x.path} />
                      </svg>
                      <span className="sr-only">{x.label} (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {columns.map((col) => (
            <nav key={col.id} aria-label={col.label}>
              <h2 className="font-display text-base font-bold tracking-wide text-white">{col.label}</h2>
              <ul className="mt-4 space-y-2.5 text-[0.95rem]">
                {col.children.map((item) => (
                  <li key={item.id}>
                    <SmartLink href={item.href} newTab={item.open_in_new_tab} className="hover:text-white hover:underline">
                      {item.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h2 className="font-display text-base font-bold tracking-wide text-white">Contact</h2>
            <address className="mt-4 space-y-3 text-[0.95rem] not-italic">
              {s.contact_address && (
                <p className="flex gap-2.5">
                  <MapPin aria-hidden className="mt-1 size-4 shrink-0 text-sky-accent" />
                  <span className="whitespace-pre-line">{s.contact_address}</span>
                </p>
              )}
              {s.contact_phone && (
                <p className="flex gap-2.5">
                  <Phone aria-hidden className="mt-1 size-4 shrink-0 text-sky-accent" />
                  <a href={`tel:${s.contact_phone_link ?? s.contact_phone}`} className="hover:text-white">
                    {s.contact_phone}
                  </a>
                </p>
              )}
              {s.contact_email && (
                <p className="flex gap-2.5">
                  <Mail aria-hidden className="mt-1 size-4 shrink-0 text-sky-accent" />
                  <a href={`mailto:${s.contact_email}`} className="break-all hover:text-white">
                    {s.contact_email}
                  </a>
                </p>
              )}
            </address>
            <Link href="/contact" className="mt-5 inline-block font-display font-semibold text-sky-accent hover:text-white">
              Send us a message →
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container-site flex flex-col gap-3 py-5 text-sm text-brand-200 md:flex-row md:items-center md:justify-between">
            <p>
              © {year} {s.copyright_holder ?? 'CARISCA, KNUST'}. All rights reserved.
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-block h-3 w-1 bg-knust-maroon" aria-hidden />
              <span className="inline-block h-3 w-1 bg-gold" aria-hidden />
              <span className="inline-block h-3 w-1 bg-knust-green" aria-hidden />
              <span>
                A centre of excellence at{' '}
                <a href="https://www.knust.edu.gh/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                  KNUST
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
