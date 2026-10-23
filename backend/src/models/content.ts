/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging, @typescript-eslint/no-empty-object-type */
import { DataTypes, Model, type Sequelize } from 'sequelize';
import {
  authorshipAttrs,
  contentOptions,
  idAttr,
  plainOptions,
  seoAttrs,
  statusAttrs,
  type AuthorshipFields,
  type SeoFields,
  type StatusFields,
} from './_shared';
import { storage } from '../services/storage';

/** Public URL of an uploaded file, from whichever storage driver holds it. */
export const publicMediaUrl = (storagePath: string) => storage.publicUrl(storagePath);

interface Timestamps {
  created_at?: Date;
  updated_at?: Date;
}
interface SoftDelete extends Timestamps {
  deleted_at?: Date | null;
}

// --------------------------------------------------------------------------- media
export interface MediaAssetAttributes extends SoftDelete {
  id: number;
  kind: 'image' | 'document' | 'video' | 'other';
  visibility: 'public' | 'private';
  filename: string;
  original_name: string;
  title: string | null;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  caption: string | null;
  storage_path: string;
  checksum: string | null;
  source_url: string | null;
  uploaded_by: number | null;
  /** Virtual: absolute public URL (null for private files). */
  url?: string | null;
}
export interface MediaAsset extends MediaAssetAttributes {}
export class MediaAsset extends Model<MediaAssetAttributes, Partial<MediaAssetAttributes>> {}

// --------------------------------------------------------------------------- pages & navigation
export interface PageAttributes extends StatusFields, SeoFields, AuthorshipFields, SoftDelete {
  id: number;
  title: string;
  path: string;
  parent_id: number | null;
  template: string;
  summary: string | null;
  body: string | null;
  hero_image_id: number | null;
  sort_order: number;
  show_in_sitemap: boolean;
  legacy_url: string | null;
}
export interface Page extends PageAttributes {}
export class Page extends Model<PageAttributes, Partial<PageAttributes>> {}

export interface MenuAttributes extends Timestamps {
  id: number;
  key: string;
  name: string;
}
export interface Menu extends MenuAttributes {}
export class Menu extends Model<MenuAttributes, Partial<MenuAttributes>> {}

export interface MenuItemAttributes extends Timestamps {
  id: number;
  menu_id: number;
  parent_id: number | null;
  label: string;
  url: string | null;
  page_id: number | null;
  description: string | null;
  open_in_new_tab: boolean;
  is_enabled: boolean;
  sort_order: number;
}
export interface MenuItem extends MenuItemAttributes {}
export class MenuItem extends Model<MenuItemAttributes, Partial<MenuItemAttributes>> {
  declare page?: Page | null;
}

export interface HomepageSlideAttributes extends StatusFields, AuthorshipFields, SoftDelete {
  id: number;
  title: string;
  caption: string | null;
  image_id: number | null;
  image_alt: string | null;
  button_label: string | null;
  button_url: string | null;
  secondary_label: string | null;
  secondary_url: string | null;
  sort_order: number;
  starts_at: Date | null;
  ends_at: Date | null;
}
export interface HomepageSlide extends HomepageSlideAttributes {}
export class HomepageSlide extends Model<HomepageSlideAttributes, Partial<HomepageSlideAttributes>> {}

// --------------------------------------------------------------------------- news
export const ARTICLE_TYPES = [
  'news',
  'press_release',
  'announcement',
  'call',
  'research_highlight',
  'project_update',
  'story',
  'newsletter_announcement',
] as const;
export type ArticleType = (typeof ARTICLE_TYPES)[number];

export interface CategoryAttributes extends Timestamps {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}
export interface Category extends CategoryAttributes {}
export class Category extends Model<CategoryAttributes, Partial<CategoryAttributes>> {}

export interface ArticleAttributes extends StatusFields, SeoFields, AuthorshipFields, SoftDelete {
  id: number;
  type: ArticleType;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  featured_image_id: number | null;
  attachment_id: number | null;
  author_name: string | null;
  deadline_at: Date | null;
  is_featured: boolean;
  legacy_url: string | null;
}
export interface Article extends ArticleAttributes {}
export class Article extends Model<ArticleAttributes, Partial<ArticleAttributes>> {
  declare categories?: Category[];
  declare setCategories: (ids: number[], options?: object) => Promise<void>;
}

// --------------------------------------------------------------------------- research
export interface ResearchThemeAttributes extends StatusFields, AuthorshipFields, SoftDelete {
  id: number;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  icon: string | null;
  image_id: number | null;
  sort_order: number;
}
export interface ResearchTheme extends ResearchThemeAttributes {}
export class ResearchTheme extends Model<ResearchThemeAttributes, Partial<ResearchThemeAttributes>> {}

export interface ResearchProjectAttributes extends StatusFields, SeoFields, AuthorshipFields, SoftDelete {
  id: number;
  theme_id: number | null;
  title: string;
  slug: string;
  summary: string | null;
  problem: string | null;
  contribution: string | null;
  relevance: string | null;
  body: string | null;
  project_status: 'planned' | 'ongoing' | 'completed';
  programme: string | null;
  start_year: number | null;
  end_year: number | null;
  lead_researchers: string | null;
  team: string | null;
  image_id: number | null;
  is_featured: boolean;
}
export interface ResearchProject extends ResearchProjectAttributes {}
export class ResearchProject extends Model<ResearchProjectAttributes, Partial<ResearchProjectAttributes>> {}

export const PUBLICATION_TYPES = [
  'research_report',
  'industry_report',
  'policy_brief',
  'journal_article',
  'working_paper',
  'research_summary',
  'book',
  'conference_paper',
  'other',
] as const;
export type PublicationType = (typeof PUBLICATION_TYPES)[number];

export interface PublicationAttributes extends StatusFields, SeoFields, AuthorshipFields, SoftDelete {
  id: number;
  type: PublicationType;
  title: string;
  slug: string;
  authors: string | null;
  abstract: string | null;
  body: string | null;
  publication_year: number | null;
  published_on: string | null;
  venue: string | null;
  doi: string | null;
  external_url: string | null;
  citation: string | null;
  cover_image_id: number | null;
  file_id: number | null;
  research_project_id: number | null;
  is_featured: boolean;
}
export interface Publication extends PublicationAttributes {}
export class Publication extends Model<PublicationAttributes, Partial<PublicationAttributes>> {}

export interface LmiReportAttributes extends StatusFields, AuthorshipFields, SoftDelete {
  id: number;
  title: string;
  slug: string;
  year: number;
  quarter: number | null;
  period_label: string;
  lmi_value: string | number | null;
  future_lmi_value: string | number | null;
  value_source_url: string | null;
  summary: string | null;
  body: string | null;
  file_id: number | null;
  cover_image_id: number | null;
}
export interface LmiReport extends LmiReportAttributes {}
export class LmiReport extends Model<LmiReportAttributes, Partial<LmiReportAttributes>> {}

export interface LmiIndicatorValueAttributes extends Timestamps {
  id: number;
  report_id: number;
  indicator: string;
  label: string;
  value: string | number;
}
export interface LmiIndicatorValue extends LmiIndicatorValueAttributes {}
export class LmiIndicatorValue extends Model<LmiIndicatorValueAttributes, Partial<LmiIndicatorValueAttributes>> {}

// --------------------------------------------------------------------------- people & partners
export interface StaffGroupAttributes extends Timestamps {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}
export interface StaffGroup extends StaffGroupAttributes {}
export class StaffGroup extends Model<StaffGroupAttributes, Partial<StaffGroupAttributes>> {}

export interface StaffProfileAttributes extends StatusFields, AuthorshipFields, SoftDelete {
  id: number;
  group_id: number | null;
  name: string;
  slug: string;
  position: string | null;
  department: string | null;
  bio: string | null;
  qualifications: string | null;
  email: string | null;
  linkedin_url: string | null;
  scholar_url: string | null;
  orcid_url: string | null;
  website_url: string | null;
  photo_id: number | null;
  sort_order: number;
  legacy_url: string | null;
}
export interface StaffProfile extends StaffProfileAttributes {}
export class StaffProfile extends Model<StaffProfileAttributes, Partial<StaffProfileAttributes>> {}

export const PARTNER_TYPES = [
  'host',
  'funder',
  'academic',
  'industry',
  'public_sector',
  'professional_body',
  'other',
] as const;

export interface PartnerAttributes extends StatusFields, AuthorshipFields, SoftDelete {
  id: number;
  name: string;
  slug: string;
  partner_type: (typeof PARTNER_TYPES)[number];
  description: string | null;
  website_url: string | null;
  logo_id: number | null;
  sort_order: number;
  is_featured: boolean;
}
export interface Partner extends PartnerAttributes {}
export class Partner extends Model<PartnerAttributes, Partial<PartnerAttributes>> {}

// --------------------------------------------------------------------------- training
export interface CpdProgrammeAttributes extends StatusFields, SeoFields, AuthorshipFields, SoftDelete {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  target_audience: string | null;
  learning_objectives: string | null;
  facilitators: string | null;
  duration: string | null;
  delivery_format: string | null;
  fee_text: string | null;
  registration_url: string | null;
  image_id: number | null;
  is_featured: boolean;
}
export interface CpdProgramme extends CpdProgrammeAttributes {}
export class CpdProgramme extends Model<CpdProgrammeAttributes, Partial<CpdProgrammeAttributes>> {}

export interface CpdSessionAttributes extends SoftDelete {
  id: number;
  programme_id: number;
  label: string | null;
  starts_at: Date;
  ends_at: Date | null;
  venue: string | null;
  delivery_mode: 'in_person' | 'online' | 'hybrid';
  fee_text: string | null;
  capacity: number | null;
  registration_status: 'open' | 'closed' | 'full' | 'cancelled';
  registration_url: string | null;
  allow_online_registration: boolean;
}
export interface CpdSession extends CpdSessionAttributes {}
export class CpdSession extends Model<CpdSessionAttributes, Partial<CpdSessionAttributes>> {
  declare programme?: CpdProgramme;
}

export interface CpdRegistrationAttributes extends Timestamps {
  id: number;
  session_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  job_title: string | null;
  attendance_mode: 'in_person' | 'online' | null;
  notes: string | null;
  consent_at: Date;
  status: 'pending' | 'confirmed' | 'waitlisted' | 'cancelled';
  ip_hash: string | null;
}
export interface CpdRegistration extends CpdRegistrationAttributes {}
export class CpdRegistration extends Model<CpdRegistrationAttributes, Partial<CpdRegistrationAttributes>> {}

// --------------------------------------------------------------------------- events, newsletters, galleries
export const EVENT_TYPES = [
  'workshop',
  'conference',
  'summit',
  'lecture',
  'training',
  'meeting',
  'webinar',
  'forum',
  'call_for_papers',
  'other',
] as const;

export interface EventAttributes extends StatusFields, SeoFields, AuthorshipFields, SoftDelete {
  id: number;
  title: string;
  slug: string;
  event_type: (typeof EVENT_TYPES)[number];
  summary: string | null;
  body: string | null;
  starts_at: Date;
  ends_at: Date | null;
  all_day: boolean;
  venue: string | null;
  location_type: 'in_person' | 'online' | 'hybrid';
  cost_text: string | null;
  registration_url: string | null;
  website_url: string | null;
  image_id: number | null;
  gallery_id: number | null;
  is_featured: boolean;
  legacy_url: string | null;
}
export interface Event extends EventAttributes {}
export class Event extends Model<EventAttributes, Partial<EventAttributes>> {}

export interface EventAttachmentAttributes extends Timestamps {
  id: number;
  event_id: number;
  media_id: number;
  label: string | null;
  sort_order: number;
}
export interface EventAttachment extends EventAttachmentAttributes {}
export class EventAttachment extends Model<EventAttachmentAttributes, Partial<EventAttachmentAttributes>> {}

export interface NewsletterAttributes extends StatusFields, AuthorshipFields, SoftDelete {
  id: number;
  issue_number: number | null;
  title: string;
  slug: string;
  published_on: string | null;
  summary: string | null;
  highlights: string | null;
  cover_image_id: number | null;
  file_id: number | null;
  online_url: string | null;
}
export interface Newsletter extends NewsletterAttributes {}
export class Newsletter extends Model<NewsletterAttributes, Partial<NewsletterAttributes>> {}

export interface GalleryAttributes extends StatusFields, AuthorshipFields, SoftDelete {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  cover_image_id: number | null;
}
export interface Gallery extends GalleryAttributes {}
export class Gallery extends Model<GalleryAttributes, Partial<GalleryAttributes>> {}

export interface GalleryItemAttributes extends Timestamps {
  id: number;
  gallery_id: number;
  media_id: number;
  caption: string | null;
  sort_order: number;
}
export interface GalleryItem extends GalleryItemAttributes {}
export class GalleryItem extends Model<GalleryItemAttributes, Partial<GalleryItemAttributes>> {}

// --------------------------------------------------------------------------- init
// Sequelize mutates attribute definitions, so every helper returns a fresh object.
const fkCol = () => ({ type: DataTypes.INTEGER.UNSIGNED, allowNull: true });
const fkRequired = () => ({ type: DataTypes.INTEGER.UNSIGNED, allowNull: false });
const str = (n: number, allowNull = true) => ({ type: DataTypes.STRING(n), allowNull });
const text = () => ({ type: DataTypes.TEXT, allowNull: true });
const medium = () => ({ type: DataTypes.TEXT('medium'), allowNull: true });
const bool = (defaultValue = false) => ({ type: DataTypes.BOOLEAN, allowNull: false, defaultValue });
const sort = () => ({ type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });
const date = () => ({ type: DataTypes.DATE, allowNull: true });

export function initContent(sequelize: Sequelize) {
  MediaAsset.init(
    {
      id: idAttr(),
      kind: { type: DataTypes.ENUM('image', 'document', 'video', 'other'), allowNull: false },
      visibility: { type: DataTypes.ENUM('public', 'private'), allowNull: false, defaultValue: 'public' },
      filename: { ...str(191, false), unique: true },
      original_name: str(255, false),
      title: str(255),
      mime_type: str(120, false),
      size_bytes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      width: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      height: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      alt_text: str(500),
      caption: str(1000),
      storage_path: str(500, false),
      checksum: { type: DataTypes.CHAR(64), allowNull: true },
      source_url: str(1000),
      uploaded_by: fkCol(),
      url: {
        type: DataTypes.VIRTUAL,
        get(this: MediaAsset) {
          return this.getDataValue('visibility') === 'public'
            ? publicMediaUrl(this.getDataValue('storage_path'))
            : null;
        },
      },
      
      
    },
    { sequelize, tableName: 'media_assets', ...contentOptions },
  );

  Page.init(
    {
      id: idAttr(),
      title: str(255, false),
      path: { ...str(191, false), unique: true },
      parent_id: fkCol(),
      template: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'standard' },
      summary: text(),
      body: medium(),
      hero_image_id: fkCol(),
      sort_order: sort(),
      show_in_sitemap: bool(true),
      legacy_url: str(500),
      ...statusAttrs(),
      ...seoAttrs(),
      ...authorshipAttrs(),
      
      
    },
    { sequelize, tableName: 'pages', ...contentOptions },
  );

  Menu.init(
    { id: idAttr(), key: { ...str(60, false), unique: true }, name: str(120, false) },
    { sequelize, tableName: 'menus', ...plainOptions },
  );

  MenuItem.init(
    {
      id: idAttr(),
      menu_id: fkRequired(),
      parent_id: fkCol(),
      label: str(120, false),
      url: str(500),
      page_id: fkCol(),
      description: str(255),
      open_in_new_tab: bool(false),
      is_enabled: bool(true),
      sort_order: sort(),
      
    },
    { sequelize, tableName: 'menu_items', ...plainOptions },
  );

  HomepageSlide.init(
    {
      id: idAttr(),
      title: str(255, false),
      caption: text(),
      image_id: fkCol(),
      image_alt: str(500),
      button_label: str(80),
      button_url: str(500),
      secondary_label: str(80),
      secondary_url: str(500),
      sort_order: sort(),
      starts_at: date(),
      ends_at: date(),
      ...statusAttrs(),
      ...authorshipAttrs(),
      
      
    },
    { sequelize, tableName: 'homepage_slides', ...contentOptions },
  );

  Category.init(
    {
      id: idAttr(),
      name: str(120, false),
      slug: { ...str(150, false), unique: true },
      description: str(500),
      sort_order: sort(),
      
    },
    { sequelize, tableName: 'categories', ...plainOptions },
  );

  Article.init(
    {
      id: idAttr(),
      type: { type: DataTypes.ENUM(...ARTICLE_TYPES), allowNull: false, defaultValue: 'news' },
      title: str(300, false),
      slug: { ...str(191, false), unique: true },
      excerpt: text(),
      body: medium(),
      featured_image_id: fkCol(),
      attachment_id: fkCol(),
      author_name: str(150),
      deadline_at: date(),
      is_featured: bool(false),
      legacy_url: str(500),
      ...statusAttrs(),
      ...seoAttrs(),
      ...authorshipAttrs(),
      
      
    },
    { sequelize, tableName: 'articles', ...contentOptions },
  );

  ResearchTheme.init(
    {
      id: idAttr(),
      name: str(150, false),
      slug: { ...str(150, false), unique: true },
      summary: text(),
      description: medium(),
      icon: str(50),
      image_id: fkCol(),
      sort_order: sort(),
      ...statusAttrs(),
      ...authorshipAttrs(),
      
      
    },
    { sequelize, tableName: 'research_themes', ...contentOptions },
  );

  ResearchProject.init(
    {
      id: idAttr(),
      theme_id: fkCol(),
      title: str(300, false),
      slug: { ...str(191, false), unique: true },
      summary: text(),
      problem: text(),
      contribution: text(),
      relevance: text(),
      body: medium(),
      project_status: {
        type: DataTypes.ENUM('planned', 'ongoing', 'completed'),
        allowNull: false,
        defaultValue: 'ongoing',
      },
      programme: str(150),
      start_year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
      end_year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
      lead_researchers: str(500),
      team: text(),
      image_id: fkCol(),
      is_featured: bool(false),
      ...statusAttrs(),
      ...seoAttrs(),
      ...authorshipAttrs(),
      
      
    },
    { sequelize, tableName: 'research_projects', ...contentOptions },
  );

  Publication.init(
    {
      id: idAttr(),
      type: { type: DataTypes.ENUM(...PUBLICATION_TYPES), allowNull: false },
      title: str(500, false),
      slug: { ...str(191, false), unique: true },
      authors: str(1000),
      abstract: text(),
      body: medium(),
      publication_year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: true },
      published_on: { type: DataTypes.DATEONLY, allowNull: true },
      venue: str(300),
      doi: str(255),
      external_url: str(1000),
      citation: text(),
      cover_image_id: fkCol(),
      file_id: fkCol(),
      research_project_id: fkCol(),
      is_featured: bool(false),
      ...statusAttrs(),
      ...seoAttrs(),
      ...authorshipAttrs(),
      
      
    },
    { sequelize, tableName: 'publications', ...contentOptions },
  );

  LmiReport.init(
    {
      id: idAttr(),
      title: str(255, false),
      slug: { ...str(191, false), unique: true },
      year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
      quarter: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
      period_label: str(100, false),
      lmi_value: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
      future_lmi_value: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
      value_source_url: str(1000),
      summary: text(),
      body: medium(),
      file_id: fkCol(),
      cover_image_id: fkCol(),
      ...statusAttrs(),
      ...authorshipAttrs(),
      
      
    },
    { sequelize, tableName: 'lmi_reports', ...contentOptions },
  );

  LmiIndicatorValue.init(
    {
      id: idAttr(),
      report_id: fkRequired(),
      indicator: str(80, false),
      label: str(150, false),
      value: { type: DataTypes.DECIMAL(5, 1), allowNull: false },
      
    },
    { sequelize, tableName: 'lmi_indicator_values', ...plainOptions },
  );

  StaffGroup.init(
    {
      id: idAttr(),
      name: str(150, false),
      slug: { ...str(150, false), unique: true },
      description: text(),
      sort_order: sort(),
      
    },
    { sequelize, tableName: 'staff_groups', ...plainOptions },
  );

  StaffProfile.init(
    {
      id: idAttr(),
      group_id: fkCol(),
      name: str(150, false),
      slug: { ...str(150, false), unique: true },
      position: str(200),
      department: str(200),
      bio: medium(),
      qualifications: text(),
      email: str(191),
      linkedin_url: str(500),
      scholar_url: str(500),
      orcid_url: str(500),
      website_url: str(500),
      photo_id: fkCol(),
      sort_order: sort(),
      legacy_url: str(500),
      ...statusAttrs(),
      ...authorshipAttrs(),
      
      
    },
    { sequelize, tableName: 'staff_profiles', ...contentOptions },
  );

  Partner.init(
    {
      id: idAttr(),
      name: str(200, false),
      slug: { ...str(191, false), unique: true },
      partner_type: { type: DataTypes.ENUM(...PARTNER_TYPES), allowNull: false, defaultValue: 'other' },
      description: text(),
      website_url: str(500),
      logo_id: fkCol(),
      sort_order: sort(),
      is_featured: bool(false),
      ...statusAttrs(),
      ...authorshipAttrs(),
      
      
    },
    { sequelize, tableName: 'partners', ...contentOptions },
  );

  CpdProgramme.init(
    {
      id: idAttr(),
      title: str(300, false),
      slug: { ...str(191, false), unique: true },
      summary: text(),
      description: medium(),
      target_audience: text(),
      learning_objectives: text(),
      facilitators: text(),
      duration: str(100),
      delivery_format: str(150),
      fee_text: str(255),
      registration_url: str(500),
      image_id: fkCol(),
      is_featured: bool(false),
      ...statusAttrs(),
      ...seoAttrs(),
      ...authorshipAttrs(),
      
      
    },
    { sequelize, tableName: 'cpd_programmes', ...contentOptions },
  );

  CpdSession.init(
    {
      id: idAttr(),
      programme_id: fkRequired(),
      label: str(200),
      starts_at: { type: DataTypes.DATE, allowNull: false },
      ends_at: date(),
      venue: str(255),
      delivery_mode: {
        type: DataTypes.ENUM('in_person', 'online', 'hybrid'),
        allowNull: false,
        defaultValue: 'in_person',
      },
      fee_text: str(255),
      capacity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      registration_status: {
        type: DataTypes.ENUM('open', 'closed', 'full', 'cancelled'),
        allowNull: false,
        defaultValue: 'closed',
      },
      registration_url: str(500),
      allow_online_registration: bool(false),
      
      
    },
    { sequelize, tableName: 'cpd_sessions', ...contentOptions },
  );

  CpdRegistration.init(
    {
      id: idAttr(),
      session_id: fkRequired(),
      full_name: str(150, false),
      email: str(191, false),
      phone: str(40),
      organisation: str(200),
      job_title: str(150),
      attendance_mode: { type: DataTypes.ENUM('in_person', 'online'), allowNull: true },
      notes: text(),
      consent_at: { type: DataTypes.DATE, allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'waitlisted', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      ip_hash: { type: DataTypes.CHAR(64), allowNull: true },
      
    },
    { sequelize, tableName: 'cpd_registrations', ...plainOptions },
  );

  Gallery.init(
    {
      id: idAttr(),
      title: str(255, false),
      slug: { ...str(191, false), unique: true },
      description: text(),
      cover_image_id: fkCol(),
      ...statusAttrs(),
      ...authorshipAttrs(),
      
      
    },
    { sequelize, tableName: 'galleries', ...contentOptions },
  );

  GalleryItem.init(
    {
      id: idAttr(),
      gallery_id: fkRequired(),
      media_id: fkRequired(),
      caption: str(1000),
      sort_order: sort(),
      
    },
    { sequelize, tableName: 'gallery_items', ...plainOptions },
  );

  Event.init(
    {
      id: idAttr(),
      title: str(300, false),
      slug: { ...str(191, false), unique: true },
      event_type: { type: DataTypes.ENUM(...EVENT_TYPES), allowNull: false, defaultValue: 'other' },
      summary: text(),
      body: medium(),
      starts_at: { type: DataTypes.DATE, allowNull: false },
      ends_at: date(),
      all_day: bool(false),
      venue: str(255),
      location_type: {
        type: DataTypes.ENUM('in_person', 'online', 'hybrid'),
        allowNull: false,
        defaultValue: 'in_person',
      },
      cost_text: str(255),
      registration_url: str(500),
      website_url: str(500),
      image_id: fkCol(),
      gallery_id: fkCol(),
      is_featured: bool(false),
      legacy_url: str(500),
      ...statusAttrs(),
      ...seoAttrs(),
      ...authorshipAttrs(),
      
      
    },
    { sequelize, tableName: 'events', ...contentOptions },
  );

  EventAttachment.init(
    {
      id: idAttr(),
      event_id: fkRequired(),
      media_id: fkRequired(),
      label: str(255),
      sort_order: sort(),
      
    },
    { sequelize, tableName: 'event_attachments', ...plainOptions },
  );

  Newsletter.init(
    {
      id: idAttr(),
      issue_number: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, unique: true },
      title: str(255, false),
      slug: { ...str(191, false), unique: true },
      published_on: { type: DataTypes.DATEONLY, allowNull: true },
      summary: text(),
      highlights: medium(),
      cover_image_id: fkCol(),
      file_id: fkCol(),
      online_url: str(1000),
      ...statusAttrs(),
      ...authorshipAttrs(),
      
      
    },
    { sequelize, tableName: 'newsletters', ...contentOptions },
  );
}
