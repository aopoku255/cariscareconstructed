import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarX, GraduationCap, Handshake, Microscope } from 'lucide-react';
import { ArticleCard, ArticleListItem, CpdSessionCard, PortalEventCard, PublicationCard } from '@/components/cards/Cards';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { ButtonLink } from '@/components/ui/Button';
import { CmsImage, type ImageSlot } from '@/components/ui/CmsImage';
import { FileDownload } from '@/components/ui/FileDownload';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { SmartLink } from '@/components/ui/SmartLink';
import { EmptyState, SectionHeading } from '@/components/ui/Typography';
import { ARTICLE_TYPE_LABELS, formatDate } from '@/lib/format';
import { EVENTS_SITE_URL } from '@/lib/config';
import { buildMetadata } from '@/lib/seo';
import { getUpcomingPortalEvents } from '@/services/events-portal';
import { getHome, getSite, resolvePage } from '@/services/public';
import type { Page } from '@/types/api';

export async function generateMetadata() {
  const { settings } = await getSite();
  return {
    ...buildMetadata({
      title: settings.seo_default_title ?? 'CARISCA',
      description: settings.seo_default_description,
      path: '/',
    }),
    title: { absolute: settings.seo_default_title ?? 'CARISCA' },
  };
}

const FOCUS: Array<{ path: string; label: string; icon: typeof Microscope; slot: ImageSlot }> = [
  { path: 'research', label: 'Research', icon: Microscope, slot: 'feature' },
  { path: 'stakeholder-engagement', label: 'Stakeholder Engagement', icon: Handshake, slot: 'stakeholder' },
  { path: 'training', label: 'Curricula & Training', icon: GraduationCap, slot: 'training' },
];

export default async function HomePage() {
  const [{ settings }, home, portalEvents, ...focusPages] = await Promise.all([
    getSite(),
    getHome(),
    getUpcomingPortalEvents(),
    ...FOCUS.map((f) => resolvePage(f.path)),
  ]);
  const [topStory, ...moreNews] = home.news;
  const lmi = home.latestLmi;

  return (
    <>
      <ScrollReveal />
      <HeroCarousel slides={home.slides} fallbackTitle={settings.site_tagline ?? 'Strong Supply Chains, Strong Communities'} fallbackCaption={settings.site_full_name} />

      {/* Introduction */}
      <section aria-labelledby="intro-heading" className="border-b border-line bg-white">
        <div data-reveal-stagger className="container-site grid gap-10 py-14 md:py-20 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow">About CARISCA</p>
            <h2 id="intro-heading" className="mt-2 text-[1.85rem] leading-tight font-bold md:text-[2.4rem]">
              {settings.home_intro_heading}
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed">{settings.home_intro_text}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/about">Learn more about CARISCA</ButtonLink>
              <ButtonLink href="/about/directors-message" variant="secondary">
                Centre Director’s message
              </ButtonLink>
            </div>
          </div>
          <aside className="rounded-(--radius-card) border-l-4 border-gold bg-surface p-6 md:p-8">
            {settings.home_highlights_title && <p className="font-display text-lg font-bold text-brand-900">{settings.home_highlights_title}</p>}
            <ul className="mt-4 list-disc space-y-3 pl-5 text-[0.98rem] marker:text-brand-400">
              {(settings.home_highlights ?? '')
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => (
                  <li key={line}>{line}</li>
                ))}
            </ul>
            <Link href="/about/partners" className="link mt-5 inline-block">
              Our partners
            </Link>
          </aside>
        </div>
      </section>

      {/* Focus areas */}
      <section aria-labelledby="focus-heading" className="bg-surface py-16 md:py-20">
        <div className="container-site">
          <SectionHeading id="focus-heading" eyebrow="What we do" title="Our focus areas" action={{ href: '/about/what-we-do', label: 'How we work' }} />
          <div data-reveal-stagger className="grid gap-6 md:grid-cols-3">
            {FOCUS.map((f, i) => {
              const page = (focusPages[i]?.type === 'page' ? focusPages[i].page : null) as Page | null;
              const Icon = f.icon;
              return (
                <article key={f.path} className="group relative flex flex-col overflow-hidden rounded-(--radius-card) bg-white shadow-(--shadow-card)">
                  <CmsImage media={page?.heroImage} slot={f.slot} sizes="(min-width:768px) 33vw, 100vw" />
                  <div className="flex flex-1 flex-col p-6">
                    <span className="relative z-10 -mt-12 mb-4 flex size-12 shrink-0 items-center justify-center rounded bg-brand-700 text-white shadow-(--shadow-card) ring-4 ring-white">
                      <Icon aria-hidden className="size-6" />
                    </span>
                    <h3 className="text-xl font-bold">
                      <Link href={`/${f.path}`} className="after:absolute after:inset-0 group-hover:text-brand-700">
                        {page?.title ?? f.label}
                      </Link>
                    </h3>
                    {page?.summary && <p className="mt-3 text-[0.98rem] text-muted">{page.summary}</p>}
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 font-display font-semibold text-brand-700" aria-hidden>
                      Explore <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* News & announcements */}
      <section aria-labelledby="news-heading" className="py-16 md:py-20">
        <div className="container-site">
          <SectionHeading id="news-heading" eyebrow="News & press releases" title="Latest from CARISCA" action={{ href: '/news', label: 'All news' }} />
          {topStory ? (
            <div data-reveal-stagger className="grid gap-10 lg:grid-cols-[2fr_1fr]">
              <div className="grid gap-6">
                <article className="group relative grid overflow-hidden rounded-(--radius-card) border border-line bg-white shadow-(--shadow-card) md:grid-cols-[1.25fr_1fr]">
                  <CmsImage media={topStory.featuredImage} slot="newsThumb" sizes="(min-width:1024px) 40vw, 100vw" priority={false} />
                  <div className="flex flex-col p-6">
                    <p className="eyebrow">Top story</p>
                    <h3 className="mt-2 text-[1.4rem] leading-snug font-bold">
                      <Link href={`/news/${topStory.slug}`} className="after:absolute after:inset-0 group-hover:text-brand-700">
                        {topStory.title}
                      </Link>
                    </h3>
                    <p className="meta mt-2">
                      {ARTICLE_TYPE_LABELS[topStory.type]} · <time dateTime={topStory.published_at}>{formatDate(topStory.published_at)}</time>
                    </p>
                    {topStory.excerpt && <p className="mt-3 line-clamp-4 text-muted">{topStory.excerpt}</p>}
                  </div>
                </article>
                <div className="grid gap-6 sm:grid-cols-2">
                  {moreNews.slice(0, 2).map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </div>
              <aside aria-labelledby="announcements-heading" className="rounded-(--radius-card) border border-line bg-white p-6">
                <div className="flex items-center justify-between">
                  <h3 id="announcements-heading" className="text-lg font-bold">
                    Announcements &amp; calls
                  </h3>
                  <Link href="/news?type=announcement,call" className="text-sm font-semibold text-brand-700 hover:underline">
                    View all
                  </Link>
                </div>
                {home.announcements.length ? (
                  <div className="mt-2">
                    {home.announcements.map((a) => (
                      <ArticleListItem key={a.id} article={a} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-muted">There are no current announcements.</p>
                )}
                {moreNews.slice(2).map((a) => (
                  <ArticleListItem key={a.id} article={a} />
                ))}
              </aside>
            </div>
          ) : (
            <EmptyState title="No news has been published yet." />
          )}
        </div>
      </section>

      {/* Research & impact */}
      <section aria-labelledby="research-heading" className="bg-brand-900 py-16 text-white md:py-20">
        <div className="container-site">
          <div data-reveal className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="font-display text-sm font-semibold tracking-[0.12em] text-sky-accent uppercase">Research &amp; evidence</p>
              <h2 id="research-heading" className="mt-2 text-[1.75rem] font-bold text-white md:text-[2.125rem]">
                Locally relevant research for Africa’s supply chains
              </h2>
            </div>
            <Link href="/research" className="inline-flex items-center gap-1.5 font-display font-semibold text-sky-accent hover:text-white">
              Research overview <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div data-reveal-stagger className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
              {home.researchThemes.map((t) => (
                <div key={t.id} className="rounded-(--radius-card) border border-white/15 bg-white/5 p-5">
                  <h3 className="text-lg font-bold text-white">{t.name}</h3>
                  {t.summary && <p className="mt-2 text-[0.95rem] text-brand-100">{t.summary}</p>}
                </div>
              ))}
            </div>
            {lmi && (
              <div data-reveal className="flex flex-col rounded-(--radius-card) bg-white p-6 text-body">
                <p className="eyebrow">Ghana Logistics Managers Index</p>
                <p className="mt-2 font-display text-lg font-bold text-ink">{lmi.period_label}</p>
                {lmi.lmi_value ? (
                  <p className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-5xl font-bold text-brand-700">{Number(lmi.lmi_value).toFixed(1)}</span>
                    <span className="text-sm text-muted">{Number(lmi.lmi_value) >= 50 ? 'Above 50: logistics activity growing' : 'Below 50: contraction'}</span>
                  </p>
                ) : (
                  <p className="mt-3 text-muted">Read the latest quarterly report.</p>
                )}
                {lmi.file && (
                  <div className="mt-4">
                    <FileDownload file={lmi.file} label="Download the report" compact />
                  </div>
                )}
                <ButtonLink href="/lmi" variant="secondary" className="mt-auto" size="sm">
                  Explore the LMI
                </ButtonLink>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Publications */}
      <section aria-labelledby="pubs-heading" className="py-16 md:py-20">
        <div className="container-site">
          <SectionHeading id="pubs-heading" eyebrow="Publications & resources" title="Reports, policy briefs and articles" action={{ href: '/publications', label: 'Browse all publications' }} />
          {home.publications.length ? (
            <div data-reveal-stagger className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {home.publications.map((p) => (
                <PublicationCard key={p.id} publication={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="No publications yet." icon={<BookOpen className="size-6" />} />
          )}
        </div>
      </section>

      {/* Training & events */}
      <section aria-labelledby="training-heading" className="bg-surface py-16 md:py-20">
        <div data-reveal-stagger className="container-site grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading id="training-heading" eyebrow="Training & CPD" title="Professional development" action={{ href: '/training/cpd', label: 'All CPDs' }} />
            {home.upcomingCpdSessions.length ? (
              <div className="grid gap-5">
                {home.upcomingCpdSessions.map((s) => (
                  <CpdSessionCard key={s.id} session={s} />
                ))}
              </div>
            ) : (
              <div className="rounded-(--radius-card) border border-line bg-white p-6">
                <p className="font-display text-lg font-semibold text-ink">No CPD sessions are scheduled at the moment.</p>
                <p className="mt-2 text-muted">Browse past programmes, or explore internationally recognised certifications offered with ISCEA.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <ButtonLink href="/training/cpd" size="sm">
                    CPD programmes
                  </ButtonLink>
                  <ButtonLink href="/training/iscea" size="sm" variant="secondary">
                    ISCEA certifications
                  </ButtonLink>
                </div>
              </div>
            )}
          </div>
          <div>
            <SectionHeading eyebrow="Events & conferences" title="Upcoming events" action={{ href: `${EVENTS_SITE_URL}/events`, label: 'All events' }} />
            {portalEvents?.length ? (
              <div className="grid gap-5">
                {portalEvents.map((e) => (
                  <PortalEventCard key={e.id} event={e} />
                ))}
              </div>
            ) : (
              <EmptyState title={portalEvents ? 'There are no upcoming events at the moment.' : 'Upcoming events could not be loaded right now.'} icon={<CalendarX className="size-6" />}>
                <p>
                  Visit the{' '}
                  <SmartLink href={`${EVENTS_SITE_URL}/events`} className="link">
                    CARISCA events portal
                  </SmartLink>
                  , see the <Link href="/events?when=past" className="link">events archive</Link>
                  {settings.summit_url && (
                    <>
                      {' '}or visit the{' '}
                      <SmartLink href={settings.summit_url} className="link">
                        {settings.summit_label ?? 'Summit'} website
                      </SmartLink>
                    </>
                  )}
                  .
                </p>
              </EmptyState>
            )}
          </div>
        </div>
      </section>

      {/* Partners */}
      {home.partners.length > 0 && (
        <section aria-labelledby="partners-heading" className="border-t border-line py-14">
          <div className="container-site">
            <SectionHeading id="partners-heading" eyebrow="Partnerships" title="Working with" action={{ href: '/about/partners', label: 'All partners' }} />
            <ul data-reveal-stagger className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {home.partners.map((p) => (
                <li key={p.id} className="flex flex-col rounded-(--radius-card) border border-line bg-white p-4">
                  <CmsImage media={p.logo} slot="partnerLogo" alt={p.logo ? `${p.name} logo` : undefined} sizes="(min-width:768px) 25vw, 50vw" />
                  <p className="mt-3 text-center text-sm font-semibold text-ink">{p.name}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Contact */}
      <section aria-labelledby="contact-heading" className="border-t border-line bg-white py-14">
        <div data-reveal className="container-site flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="contact-heading" className="text-2xl font-bold">
              Get in touch
            </h2>
            <p className="mt-2 text-muted">
              {[settings.contact_address?.split('\n')[0], settings.contact_phone, settings.contact_email].filter(Boolean).join(' · ')}
            </p>
          </div>
          <ButtonLink href="/contact">Contact CARISCA</ButtonLink>
        </div>
      </section>
    </>
  );
}
