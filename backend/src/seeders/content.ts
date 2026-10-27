import fs from 'node:fs/promises';
import path from 'node:path';
import type { Model, ModelStatic, Transaction, WhereOptions } from 'sequelize';
import {
  CpdProgramme,
  CpdSession,
  HomepageSlide,
  LmiIndicatorValue,
  LmiReport,
  Newsletter,
  Page,
  Partner,
  Publication,
  Redirect,
  ResearchProject,
  ResearchTheme,
  StaffGroup,
  StaffProfile,
} from '../models';
import { storeUpload } from '../services/media.service';
import { sanitizeRichText } from '../utils/html';
import { slugify } from '../utils/slug';
import {
  cpdProgrammes,
  lmiReports,
  newsletters,
  partners,
  publications,
  researchProjects,
  researchThemes,
  slides,
  staff,
} from './data/curated';
import { pages } from './data/pages';

const PUBLISHED_AT = new Date('2026-10-21T00:00:00Z');
const PARTNER_LOGOS = path.join(__dirname, 'assets', 'partner-logos');
const LOGO_REVIEW = 'Upload the approved partner logo.';

/** Stores a file shipped with the seeders through the normal upload path (validation + active storage driver). */
async function storeBundledFile(file: string, meta: { alt_text: string; title: string }) {
  const buffer = await fs.readFile(file);
  return storeUpload(
    { originalname: path.basename(file), buffer, size: buffer.length, mimetype: '', fieldname: 'file', encoding: '7bit' } as Express.Multer.File,
    meta,
  );
}

/** Creates the row if no row matches `where`; never overwrites existing (possibly edited) content. */
async function ensure<M extends Model>(model: ModelStatic<M>, where: WhereOptions, values: Record<string, unknown>, t?: Transaction) {
  const existing = await model.findOne({ where, paranoid: false, transaction: t });
  if (existing) return { row: existing, created: false };
  const row = await model.create(values as M['_creationAttributes'], { transaction: t });
  return { row, created: true };
}

export function staffSlug(name: string) {
  return slugify(name.replace(/^(Prof\.|Dr\.|Dr|Prof)\s*/i, ''));
}

export async function seedPages(t?: Transaction) {
  let created = 0;
  // Parents first so parent_id can be resolved.
  const ordered = [...pages].sort((a, b) => a.path.split('/').length - b.path.split('/').length);
  for (const p of ordered) {
    const parent = p.parent ? await Page.findOne({ where: { path: p.parent }, transaction: t }) : null;
    const status = p.status ?? 'published';
    const r = await ensure(
      Page,
      { path: p.path },
      {
        path: p.path,
        title: p.title,
        summary: p.summary ?? null,
        body: sanitizeRichText(p.body),
        template: p.template ?? 'standard',
        parent_id: parent?.id ?? null,
        sort_order: p.sort_order ?? 0,
        status,
        published_at: status === 'published' ? PUBLISHED_AT : null,
        legacy_url: p.legacy_url ?? null,
        review_note: p.review ?? null,
      },
      t,
    );
    if (r.created) created++;
  }
  return created;
}

export async function seedPeopleAndPartners(t?: Transaction) {
  let created = 0;
  const groups = Object.fromEntries((await StaffGroup.findAll({ transaction: t })).map((g) => [g.slug, g.id]));
  for (const [i, s] of staff.entries()) {
    const slug = staffSlug(s.name);
    const r = await ensure(
      StaffProfile,
      { slug },
      {
        slug,
        name: s.name,
        position: s.position ?? null,
        group_id: groups[s.group] ?? null,
        sort_order: i,
        status: 'published',
        published_at: PUBLISHED_AT,
        legacy_url: s.legacy_profile ?? null,
        review_note: s.review ?? null,
      },
      t,
    );
    if (r.created) created++;
  }
  for (const [i, p] of partners.entries()) {
    const slug = slugify(p.name);
    const r = await ensure(
      Partner,
      { slug },
      {
        slug,
        name: p.name,
        partner_type: p.partner_type,
        website_url: p.website_url,
        description: p.description,
        is_featured: p.is_featured,
        sort_order: i,
        status: 'published',
        published_at: PUBLISHED_AT,
        review_note: ('review' in p ? p.review : null) ?? (p.logo_file ? null : LOGO_REVIEW),
      },
      t,
    );
    if (r.created) created++;
    // Attaches the bundled logo once; a logo chosen in the dashboard is never replaced.
    if (p.logo_file && !r.row.logo_id) {
      const logo = await storeBundledFile(path.join(PARTNER_LOGOS, p.logo_file), { alt_text: `${p.name} logo`, title: p.name });
      await r.row.update(
        { logo_id: logo.id, review_note: r.row.review_note === LOGO_REVIEW ? null : r.row.review_note },
        { transaction: t },
      );
    }
  }
  return created;
}

export async function seedResearch(t?: Transaction) {
  let created = 0;
  for (const [i, theme] of researchThemes.entries()) {
    const slug = slugify(theme.name);
    const r = await ensure(
      ResearchTheme,
      { slug },
      {
        slug,
        name: theme.name,
        summary: theme.summary,
        icon: theme.icon,
        sort_order: i,
        status: 'published',
        published_at: PUBLISHED_AT,
        review_note: 'Theme grouping proposed during the website reconstruction from CARISCA’s stated focus areas. Confirm wording.',
      },
      t,
    );
    if (r.created) created++;
  }
  const themes = Object.fromEntries((await ResearchTheme.findAll({ transaction: t })).map((th) => [th.slug, th.id]));
  for (const p of researchProjects) {
    const slug = slugify(p.title);
    const r = await ensure(
      ResearchProject,
      { slug },
      {
        slug,
        title: p.title,
        summary: p.summary,
        lead_researchers: p.lead_researchers,
        programme: p.programme,
        project_status: p.project_status,
        theme_id: p.theme ? (themes[p.theme] ?? null) : null,
        status: 'published',
        published_at: PUBLISHED_AT,
        review_note: p.review,
      },
      t,
    );
    if (r.created) created++;
  }
  for (const p of publications) {
    const slug = slugify(p.title);
    const r = await ensure(
      Publication,
      { slug },
      {
        slug,
        type: p.type,
        title: p.title,
        publication_year: p.year ?? null,
        external_url: p.external_url ?? null,
        status: 'published',
        published_at: PUBLISHED_AT,
        review_note: p.review ?? null,
      },
      t,
    );
    if (r.created) created++;
  }
  for (const l of lmiReports) {
    const slug = `ghana-lmi-${l.year}-q${l.quarter}`;
    const r = await ensure(
      LmiReport,
      { slug },
      {
        slug,
        title: `Ghana LMI Report: ${l.period_label}`,
        year: l.year,
        quarter: l.quarter,
        period_label: l.period_label,
        lmi_value: l.lmi_value ?? null,
        future_lmi_value: l.future_lmi_value ?? null,
        value_source_url: l.value_source ?? null,
        status: 'published',
        published_at: PUBLISHED_AT,
        review_note: l.review ?? null,
      },
      t,
    );
    if (r.created) {
      created++;
      for (const ind of l.indicators ?? []) {
        await LmiIndicatorValue.create({ ...ind, report_id: r.row.get('id') as number }, { transaction: t });
      }
    }
  }
  return created;
}

export async function seedPublishing(t?: Transaction) {
  let created = 0;
  for (const n of newsletters) {
    const slug = `issue-${n.issue}`;
    const r = await ensure(
      Newsletter,
      { slug },
      {
        slug,
        issue_number: n.issue,
        title: n.title,
        published_on: n.published_on,
        online_url: n.online_url ?? null,
        status: 'published',
        published_at: new Date(`${n.published_on}T00:00:00Z`),
        review_note: n.review ?? null,
      },
      t,
    );
    if (r.created) created++;
  }
  for (const c of cpdProgrammes) {
    const r = await ensure(
      CpdProgramme,
      { slug: c.slug },
      {
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        description: sanitizeRichText(c.description),
        facilitators: c.facilitators,
        duration: c.duration,
        delivery_format: c.delivery_format,
        fee_text: c.fee_text,
        registration_url: c.registration_url,
        status: 'published',
        published_at: PUBLISHED_AT,
        review_note: c.review,
      },
      t,
    );
    if (r.created) {
      created++;
      for (const s of c.sessions) {
        await CpdSession.create(
          {
            programme_id: r.row.get('id') as number,
            starts_at: new Date(s.starts_at),
            ends_at: 'ends_at' in s && s.ends_at ? new Date(s.ends_at) : null,
            venue: s.venue,
            delivery_mode: s.delivery_mode,
            fee_text: s.fee_text,
            registration_status: s.registration_status,
            registration_url: s.registration_url,
          },
          { transaction: t },
        );
      }
    }
  }
  for (const [i, s] of slides.entries()) {
    const status = i === 0 ? 'published' : 'draft';
    const r = await ensure(
      HomepageSlide,
      { title: s.title },
      {
        title: s.title,
        caption: s.caption,
        image_alt: s.image_alt,
        button_label: s.button_label,
        button_url: s.button_url,
        secondary_label: s.secondary_label,
        secondary_url: s.secondary_url,
        sort_order: i,
        status,
        published_at: status === 'published' ? PUBLISHED_AT : null,
        review_note:
          i === 0 ? s.review : 'Slide wording drafted during the reconstruction (not from the legacy site). Approve before publishing.',
      },
      t,
    );
    if (r.created) created++;
  }
  return created;
}

/** Legacy WordPress URLs for sections whose structure changed. Post/event redirects are added by the importer. */
export const SECTION_REDIRECTS: Array<[string, string]> = [
  ['/about-us', '/about'],
  ['/about-us/about-us', '/about'],
  ['/about-us/centre-driectors-message', '/about/directors-message'],
  ['/about-us/mission-and-vision', '/about'],
  ['/about-us/management', '/about/team'],
  ['/about-us/our-team', '/about/team'],
  ['/meet-the-team', '/about/team'],
  ['/our-team', '/about/team'],
  ['/research-faculty', '/about/team'],
  ['/what-we-do', '/about/what-we-do'],
  ['/what-we-do/industry-engagement', '/stakeholder-engagement/industry-engagement'],
  ['/what-we-do/research-capacity-development', '/research/research-capacity-development'],
  ['/what-we-do/professional-training-and-education', '/training/professional-training-and-education'],
  ['/component-1-research', '/research'],
  ['/research-page', '/research'],
  ['/research/our-resources', '/publications'],
  ['/research/journal-articles', '/publications?type=journal_article'],
  ['/research/book-publications', '/publications'],
  ['/research/conferences-and-talks', '/events?when=past'],
  ['/our-books', '/publications'],
  ['/component-2-stakeholder-engagement', '/stakeholder-engagement'],
  ['/industry', '/stakeholder-engagement'],
  ['/industry/local-ghanaian-partners', '/about/partners'],
  ['/industry/african-regional-partners', '/about/partners'],
  ['/industry/international-partners', '/about/partners'],
  ['/industry/consultancy-services', '/stakeholder-engagement'],
  ['/industry/supply-chain-action-laboratory-engagement-scale', '/stakeholder-engagement/supply-chain-action-network'],
  ['/curricula-training', '/training'],
  ['/training/academic-programs', '/training/academic-programmes'],
  ['/training/executive-training', '/training/cpd'],
  ['/training/short-course-certification', '/training/cpd'],
  ['/training/cpd/masterclass-experience', '/training/masterclass-experience'],
  ['/new-supply-chain-graduate-programmes', '/training/academic-programmes'],
  ['/scholarship', '/training/scholarships'],
  ['/cariscaprogrammes', '/training'],
  ['/international-certified-supply-chain-education-alliance-iscea', '/training/iscea'],
  ['/distinguished-lecture-series', '/research/distinguished-lecture-series'],
  ['/innovations', '/research/innovations-lab'],
  ['/carisca-dissertation-awards', '/research/dissertation-awards'],
  ['/news-events', '/news'],
  ['/news-events/news-press-releases', '/news'],
  ['/category/news-and-press-release', '/news'],
  ['/category/announcements', '/news?type=announcement,call'],
  ['/news-events/events', '/events'],
  ['/our-events', '/events'],
  ['/news-events/news-press-releases/gallery', '/gallery'],
  ['/carisca-newsletters', '/newsletters'],
  ['/contact-us', '/contact'],
  ['/summit2024', '/supply-chain-research-summit'],
  ['/2026-supply-chain-research-summit', '/supply-chain-research-summit/2026'],
  ['/2025-supply-chain-research-summit', '/supply-chain-research-summit/2025'],
  ['/2023-supply-chain-research-summit', '/supply-chain-research-summit/2023'],
  ['/carisca-2022-supply-chain-research-summit', '/supply-chain-research-summit/2022'],
  ['/2024businessforum', '/supply-chain-business-forum-2024'],
  ['/ghanas-first-logistics-managers-index-reveals-growth-in-logistics-activities', '/lmi'],
];

export async function seedRedirects(t?: Transaction) {
  const extra: Array<[string, string]> = staff
    .filter((s) => s.legacy_profile)
    .map((s) => [new URL(s.legacy_profile!).pathname.replace(/\/$/, ''), `/about/team/${staffSlug(s.name)}`]);
  let created = 0;
  for (const [from_path, to_path] of [...SECTION_REDIRECTS, ...extra]) {
    const r = await ensure(Redirect, { from_path }, { from_path, to_path, status_code: 301, note: 'Legacy WordPress URL' }, t);
    if (r.created) created++;
  }
  return created;
}
