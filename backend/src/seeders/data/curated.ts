/**
 * Verified institutional content transcribed from the existing CARISCA website
 * (https://carisca.knust.edu.gh/, audited 21 Oct 2026 — see docs/website-audit.md).
 *
 * Rules:
 *  - Nothing here is invented. Where a value is inferred (e.g. a year from an upload path)
 *    the record carries a `review` note that surfaces as "Needs review" in the dashboard.
 *  - `*_source` fields are URLs of the original files. The WordPress importer downloads them
 *    into the media library; until then the site shows labelled placeholders.
 */

const WP = 'https://carisca.knust.edu.gh/wp-content/uploads';

// ---------------------------------------------------------------------------- staff
export const staffGroups = [
  {
    slug: 'secretariat',
    name: 'Secretariat Staff',
    description:
      'The Secretariat provides leadership, strategic oversight, and operational support across all functional areas of the Centre. Their work ensures that CARISCA’s activities run efficiently and align with institutional goals.',
  },
  {
    slug: 'senior-technical-advisors',
    name: 'Senior Technical Advisors and Component Leads',
    description:
      'CARISCA’s Senior Technical Advisors and Component Leads provide strategic direction and technical expertise across the Centre’s core focus areas and activities. They are seasoned academics and practitioners who guide programme design, research priorities, and implementation strategies to ensure that CARISCA’s initiatives achieve measurable and sustainable impact.',
  },
  {
    slug: 'research-faculty',
    name: 'Research Faculty',
    description:
      'CARISCA’s Research Faculty serve as subject-matter experts and consultants who provide specialised research expertise to support the Centre’s research and initiatives.',
  },
];

interface StaffSeed {
  group: string;
  name: string;
  position?: string;
  photo_source?: string;
  /** Legacy WordPress profile page holding a biography (imported by the WordPress importer). */
  legacy_profile?: string;
  review?: string;
}

const legacy = (path: string) => `https://carisca.knust.edu.gh/${path}/`;

export const staff: StaffSeed[] = [
  // Secretariat
  { group: 'secretariat', name: 'Prof. Nathaniel Boso', position: 'Centre Director', photo_source: `${WP}/2020/08/Prof-Nathaniel-Boso_2.jpg`, legacy_profile: legacy('about-us/our-team/professor-nathaniel-boso') },
  { group: 'secretariat', name: 'Amos Ato Eghan', position: 'Director of Operations', photo_source: `${WP}/2023/03/Amos-Ato-Eghan.jpg` },
  { group: 'secretariat', name: 'Kekeli Adonu', position: 'Director of Monitoring, Evaluation, Research and Learning', photo_source: `${WP}/2025/10/Kekeli-2.png`, legacy_profile: legacy('lolynda-kekeli-adonu') },
  { group: 'secretariat', name: 'Dr. Elsie Konadu Addae', position: 'Administrative Manager', photo_source: `${WP}/2025/10/Elsie-1.png`, legacy_profile: legacy('about-us/our-team/elsie-konadu-addae') },
  { group: 'secretariat', name: 'Christa Agyemang', position: 'Communications Manager', photo_source: `${WP}/2025/10/Christa.png`, legacy_profile: legacy('christa-nyameye-agyemang') },
  { group: 'secretariat', name: 'Evans Ankomah Jr.', position: 'Business and Development Manager', photo_source: `${WP}/2022/07/Evans-Kwasi-Ankomah-e1665751949908.png` },
  { group: 'secretariat', name: 'Benjamin Ashong', position: 'IT Officer', photo_source: `${WP}/2025/10/Ben.png` },
  { group: 'secretariat', name: 'Martin Agbodzi', position: 'Research and Training Coordinator', photo_source: `${WP}/2025/10/Martin.png` },
  { group: 'secretariat', name: 'Collins Boakye Dankwa', position: 'CPD and Academic Programmes Coordinator', photo_source: `${WP}/2022/07/collins.jpg` },
  { group: 'secretariat', name: 'Dr. Owusu Acheampong', position: 'Project Accountant', photo_source: `${WP}/2022/10/Owusu-Acheampong-1.jpg`, review: 'Name appears as "Dr.Owusu Acheampong" on the legacy site; confirm spelling.' },
  {
    group: 'secretariat',
    name: 'Martha Adzraku',
    position: 'Senior Accounting Assistant',
    review: 'The legacy site shows the image file "CSO-Maame-Dentu.jpg" for this person; portrait not imported. Supply an approved photograph.',
  },
  // Senior Technical Advisors and Component Leads
  { group: 'senior-technical-advisors', name: 'Prof. Abdul Samed Muntaka', position: 'Industry Engagement and Education Lead', photo_source: `${WP}/2025/10/Muntaka.png`, legacy_profile: legacy('dr-abdul-sameed-muntaka') },
  { group: 'senior-technical-advisors', name: 'Dr. Dominic Essuman', position: 'Research Lead', photo_source: `${WP}/2023/03/Dominic-Essuman-268x300-1.jpg`, legacy_profile: legacy('dr-dominic-essuman') },
  { group: 'senior-technical-advisors', name: 'Prof. Adegoke Oke', position: 'CARISCA Research Summit Co-Chair', photo_source: `${WP}/2020/08/Adegoke_Oke.jpg`, legacy_profile: legacy('prof-adegoke-oke') },
  { group: 'senior-technical-advisors', name: 'Dr. Evans Amoah', position: 'IT Technical Advisor, Summit', photo_source: `${WP}/2025/10/Evans-Amoah-1.png` },
  {
    group: 'senior-technical-advisors',
    name: 'Dr. John Manso-Frimpong',
    legacy_profile: legacy('dr-john-manso-frimpong'),
    review: 'The legacy site shows the image file "Muntaka-1.png" for this person, which appears to be the wrong portrait; not imported. Role not stated on Meet the Team.',
  },
  { group: 'senior-technical-advisors', name: 'Dr. John Serbe Marfo', photo_source: `${WP}/2020/08/john_serbe_marfo_new.jpg`, legacy_profile: legacy('about-us/our-team/john-marfo'), review: 'Role not stated on Meet the Team.' },
  { group: 'senior-technical-advisors', name: 'Dr. Matilda Owusu-Bio', photo_source: `${WP}/2020/08/DR.-MRS.-MATILDA-KOKUI-OWUSU-BIO.jpg`, legacy_profile: legacy('dr-matilda-owusu-bio'), review: 'Role not stated on Meet the Team.' },
  { group: 'senior-technical-advisors', name: 'Prof. Dale Rogers', photo_source: `${WP}/2022/10/Dale-Rogers.jpg`, legacy_profile: legacy('prof-dale-rogers'), review: 'Role not stated on Meet the Team.' },
  { group: 'senior-technical-advisors', name: 'Dr. David Schlinkert', photo_source: `${WP}/2021/06/sxxxxxxxxxxxxxxxdddddddddddddd.jpg`, legacy_profile: legacy('david-schlinkert'), review: 'Role not stated on Meet the Team.' },
  { group: 'senior-technical-advisors', name: 'Barby Grant', photo_source: `${WP}/2023/03/Barby.jpg`, review: 'Role not stated on Meet the Team.' },
  { group: 'senior-technical-advisors', name: 'Alma Telibecirevic', photo_source: `${WP}/2023/11/Alma-Telibecirevic2-1536x1536-1.jpg`, review: 'Role not stated on Meet the Team. Photo credit on legacy file: Andy DeLisle.' },
  { group: 'senior-technical-advisors', name: 'Prof. Thomas Choi', photo_source: `${WP}/2020/08/thomas_choi.jpg`, legacy_profile: legacy('prof-thomas-choi'), review: 'Role not stated on Meet the Team.' },
  { group: 'senior-technical-advisors', name: 'Prof. Mohan Gopalakrishnan', photo_source: `${WP}/2020/08/Mohan2.jpg`, legacy_profile: legacy('prof-mohan-gopalakrishnan'), review: 'Role not stated on Meet the Team.' },
  {
    group: 'senior-technical-advisors',
    name: 'Prof. Joseph Van Orden',
    review: 'The legacy site shows the image file "Muntaka-2.png" for this person, which appears to be the wrong portrait; not imported. Role not stated on Meet the Team.',
  },
  { group: 'senior-technical-advisors', name: 'Dr. Roseanne Schuster', photo_source: `${WP}/2020/08/roseanne_schuster.jpg`, legacy_profile: legacy('dr-roseanne-schuster'), review: 'Role not stated on Meet the Team.' },
  // Research Faculty
  { group: 'research-faculty', name: 'Prof. Priscilla Mante', photo_source: `${WP}/2021/08/Priscilla-Mante.jpg`, legacy_profile: legacy('priscilla-kolibea-mante') },
  { group: 'research-faculty', name: 'Dr. Richard Boso', photo_source: `${WP}/2023/03/Richard-Boso.png` },
  { group: 'research-faculty', name: 'Dr. Emmanuel Quansah', photo_source: `${WP}/2022/10/Emmanuel-Quansah-e1665757678699.jpg`, legacy_profile: legacy('emmanuel-quansah'), review: 'Spelled "Emmaunuel" on the legacy site; corrected to "Emmanuel" — confirm.' },
  { group: 'research-faculty', name: 'Prof. Robert Aidoo', photo_source: `${WP}/2022/07/aidoo-nice.jpg`, legacy_profile: legacy('robert-aidoo') },
  { group: 'research-faculty', name: 'Dr. Listowel Owusu Appiah', photo_source: `${WP}/2022/07/listowel-nice.jpg` },
  { group: 'research-faculty', name: 'Dr. Henry Ataburo', photo_source: `${WP}/2023/03/Henry-Ataburo.jpg` },
  { group: 'research-faculty', name: 'Prof. Emmanuel Anin', photo_source: `${WP}/2023/03/Emmanuel-Anin-cropped-1.jpg`, review: 'Spelled "Emmaunuel" on the legacy site; corrected to "Emmanuel" — confirm.' },
];

// ---------------------------------------------------------------------------- partners
export const partners = [
  {
    name: 'Kwame Nkrumah University of Science and Technology (KNUST)',
    partner_type: 'host' as const,
    website_url: 'https://www.knust.edu.gh/',
    description: 'CARISCA is an interdisciplinary centre of excellence established at KNUST, Kumasi, Ghana.',
    is_featured: true,
    logo_file: 'logo-knust 1.svg',
  },
  {
    name: 'LEARN Logistics by Kühne Foundation',
    partner_type: 'funder' as const,
    website_url: null,
    description: 'The Centre is supported by LEARN Logistics by Kühne Foundation.',
    is_featured: true,
    logo_file: 'kuhne 3.svg',
    review: 'Add the official website URL.',
  },
  {
    name: 'Arizona State University (ASU)',
    partner_type: 'academic' as const,
    website_url: 'https://www.asu.edu/',
    description: 'CARISCA was established at KNUST in partnership with Arizona State University.',
    is_featured: true,
    logo_file: 'ASU-Logo.svg',
  },
  {
    name: 'International Supply Chain Education Alliance (ISCEA)',
    partner_type: 'professional_body' as const,
    website_url: 'https://www.isceaonline.com/',
    description: 'Partner for internationally recognised supply chain certification programmes offered through CARISCA.',
    is_featured: true,
  },
];

// ---------------------------------------------------------------------------- research
export const researchThemes = [
  {
    name: 'Healthcare Supply Chains',
    icon: 'HeartPulse',
    summary:
      'Improving the efficiency and effectiveness of health care value chains, including pharmaceutical traceability and health supply chain financing.',
  },
  {
    name: 'Agricultural Supply Chains',
    icon: 'Wheat',
    summary:
      'Strengthening agricultural value chains across sub-Saharan Africa, from logistics services to food losses and sustainable financing.',
  },
  {
    name: 'Trade, Logistics and Policy',
    icon: 'Ship',
    summary:
      'Evidence on trade corridors, ports, logistics activity and policy — including the Ghana Logistics Managers Index and AfCFTA implementation.',
  },
  {
    name: 'Emerging Technologies in Supply Chains',
    icon: 'Cpu',
    summary:
      'Emerging approaches such as artificial intelligence and machine learning, blockchain, simulation, the Internet of Things and low-infrastructure solutions.',
  },
];

/** The five current ASN-RA research team projects, as listed on /asn-ra/. */
export const researchProjects = [
  {
    title: "From resistance to acceptance of SMEs' supplier development initiatives",
    lead_researchers: 'Assilah Agigi, Alfred Sallwa, Bonny Bagenda, Mona Ali',
    theme: null,
  },
  {
    title: 'Scalability of Relationships and Construction Procurement in Sub-Saharan Africa',
    lead_researchers: 'Busha Kitessa, Usman Abbas',
    theme: null,
  },
  {
    title: 'Re-interpreting last-mile delivery in the African Informal Markets',
    lead_researchers: 'Priscilla Addo Asamany, Caleb Kumi, Kelvinne Mocke, Felix Mogesa',
    theme: 'trade-logistics-and-policy',
  },
  {
    title: 'Family Financing in Pharmaceutical Supply Chains: Evidence from Sub-Saharan Africa',
    lead_researchers: 'Kalubanga Matthew, Suleiman Mohammed Ali, Kalema Roberts, Esther Nandara',
    theme: 'healthcare-supply-chains',
  },
  {
    title: 'Supercharging horizontal trade in Africa: Current state and way forward',
    lead_researchers: 'Benjamin Agyei-Owusu, Barima Okyere Anim, Joseph Onyango',
    theme: 'trade-logistics-and-policy',
  },
].map((p) => ({
  ...p,
  programme: 'ASN-RA',
  project_status: 'ongoing' as const,
  summary: `An Africa Supply Network Research Accelerator (ASN-RA) team project aimed at publication in top-tier, peer-reviewed journals. Team: ${p.lead_researchers}.`,
  review: 'Only the title and team are published on the legacy site. Add the research problem, contribution and practical relevance.',
}));

// ---------------------------------------------------------------------------- publications
type PubSeed = {
  type: 'industry_report' | 'research_report' | 'policy_brief' | 'journal_article';
  title: string;
  file_source?: string;
  external_url?: string;
  year?: number;
  review?: string;
};

const fromUpload = (path: string, year: number): Pick<PubSeed, 'file_source' | 'year' | 'review'> => ({
  file_source: `${WP}/${path}`,
  year,
  review: 'Publication year inferred from the file upload date on the legacy site; authors not listed. Confirm both.',
});

export const publications: PubSeed[] = [
  { type: 'research_report', title: 'CARISCA Research Report: June 2021 – Oct. 2025', ...fromUpload('2025/10/CARISCA-Research-Report-JuneOct-21-25.pdf', 2025) },
  { type: 'industry_report', title: 'The Automobile Sector in Ghana: A Comprehensive Sectorial Report', ...fromUpload('2025/10/REPORT_ON_AUTOMOBILE_SECTOR_OF_GHANA.pdf', 2025) },
  { type: 'industry_report', title: 'AfCFTA Framework Implementation Pain Points: Insights from the Abidjan–Lagos Trade Corridor', ...fromUpload('2025/08/AfCFTA-FRAMEWORK-IMPLEMENTATION-PAIN-POINTS-INSIGHTS-FROM-THE-ABIDJAN-LAGOS-TRADE-CORRIDOR-2.pdf', 2025) },
  { type: 'industry_report', title: 'Is there a link between port traffic and government tax revenue? A report on port traffic, competitiveness, and tax revenue', ...fromUpload('2025/04/Is-there-a-link-between-port-traffic-and-government-tax-CARISCA.pdf', 2025) },
  { type: 'industry_report', title: 'Health Supply Chain Financing System in Ghana: Implications for Policy and Practice', ...fromUpload('2024/12/Health-Supply-Chain-Financing-System-in-Ghana-Implications-for-Policy-and-Practice-8.pdf', 2024) },
  { type: 'industry_report', title: 'Combating drug counterfeiting for better healthcare: An assessment of traceability in the pharmaceutical supply chain in Ghana', ...fromUpload('2024/12/Combating-drug-counterfeiting-for-better-healthcare-An-assessment-of-traceability-in-the-pharmaceutical-supply-chain-in-Ghana.-4.pdf', 2024) },
  { type: 'industry_report', title: 'State of Affairs of Logistics Services in Ghana’s Agricultural Supply Chains', ...fromUpload('2024/06/STATE-OF-AFFAIRS-OF-LOGISTICS-SERVICES-IN-GHANAS-AGRICULTURAL-SUPPLY-CHAINS-2.pdf', 2024) },
  { type: 'research_report', title: 'Graduate Employability Report', ...fromUpload('2025/01/CARISCA-Graduate-Employability-Report-1.pdf', 2025) },
  { type: 'industry_report', title: 'Agricultural Supply Chain Activities in Ghana – A Focus on Roots and Tubers and Cereals Sub-Sectors', ...fromUpload('2023/12/Final-AGRICULTURAL-SUPPLY-CHAIN-ACTIVITIES-IN-GHANA-–-A-Focus-on-Roots-Tubers-and-Cereals-Sub-sectors.pdf', 2023) },
  { type: 'industry_report', title: 'The Role of Supply Chain Management in Healthcare Access in Ghana', ...fromUpload('2023/10/Industry-Report_Priscilla-Mante-Revised-design-Final-1.pdf', 2023) },
  { type: 'industry_report', title: 'African Supply Chains: Meandering the AfCFTA Maze', ...fromUpload('2022/12/African-Supply-Chains_-Meandering-the-AFCTA-Maze-.pdf', 2022) },
  { type: 'policy_brief', title: 'Enhancing Drug Traceability in Ghana to Combat Counterfeit Medicines', ...fromUpload('2024/12/Policy-Brief-Enhancing-Drug-Traceability-in-Ghana-to-Combat-Counterfeit-Medicines-1.pdf', 2024) },
  { type: 'policy_brief', title: 'Health Supply Chain Financing System in Ghana: Implications for Policy and Practice (Policy Brief)', ...fromUpload('2024/12/Health-Supply-Chain-Financing-System-in-Ghana-Implications-for-Policy-and-Practice-6-1.pdf', 2024) },
  { type: 'policy_brief', title: 'Food Losses along the Cassava Supply Chain in Ghana: Causes and Solutions', ...fromUpload('2023/10/Food-Losses-along-the-Cassava-Supply-Chain-in-Ghana-Causes-and-Solutions-2.pdf', 2023) },
  { type: 'policy_brief', title: 'Thriving Through Disruptions: Enhancing Supply Resilience with Effective Leadership', ...fromUpload('2023/10/Thriving-Through-Disruptions-Enhancing-Supply-Resilience-with-Effective-Leadership-2.pdf', 2023) },
  { type: 'policy_brief', title: 'Toward Food Security in Ghana: Financing Options for Sustainable Food Supply Chains', ...fromUpload('2023/08/Toward-Food-Security-in-Ghana-Financing-Options-for-Sustainable-Food-Supply-Chains-2.pdf-1.pdf', 2023) },
  { type: 'policy_brief', title: 'How Do Digital Technologies Improve Sustainable Performance Among Smallholder Farmers?', ...fromUpload('2023/08/Policy-Brief-How-Do-Digital-Technologies-Improve-Sustainable-Performance-Among-Smallholder-Farmers.pdf', 2023) },
  ...(
    [
      ['International product adaptation and performance: A systematic analysis of the literature and agenda for future research', 'https://www.sciencedirect.com/science/article/pii/S1090951624000774'],
      ['Clarifying supply chain disruption and operational resilience relationship from a threat-rigidity perspective: Evidence from small and medium-sized enterprises', 'https://www.sciencedirect.com/science/article/pii/S0925527324001713'],
      ['Firm resilience, stressors, and entrepreneurial well-being: insights from women entrepreneurs in Ghana', 'https://www.emerald.com/insight/content/doi/10.1108/ijebr-07-2023-0742/full/html'],
      ['Antecedents of sustainable agricultural supply chain financing for achieving food security in resource-constrained developing economies: A complex adaptive systems theory perspective', 'https://onlinelibrary.wiley.com/doi/10.1111/1467-8489.12579'],
      ['How do firms develop and financially benefit from green product innovation in a developing country? Roles of innovation orientation and green marketing innovation', 'https://onlinelibrary.wiley.com/doi/10.1002/bse.3864'],
      ['Reverse logistics and financial performance in a developing country context: the moderating role of analytics capability', 'https://www.emerald.com/insight/content/doi/10.1108/jrpc-11-2023-0020/full/html'],
      ['Leveraging foreign diversification to build firm resilience: A conditional process perspective', 'https://www.sciencedirect.com/science/article/pii/S107542532300087X'],
      ['In search of operational resilience: How and when improvisation matters', 'https://onlinelibrary.wiley.com/doi/10.1111/jbl.12343'],
      ['International network formation, home market institutional support and post-entry performance of international new ventures', 'https://doi.org/10.1016/j.ibusrev.2021.101968'],
      ['Institutionalization of protection for intangible assets: Insights from the counterfeit and pirated goods trade in sub-Saharan Africa', 'https://www.sciencedirect.com/science/article/pii/S1090951621001188'],
      ['Out of Africa', 'https://www.scmr.com/article/out_of_africa'],
      ['Does purchasing recognition help or hinder purchasing quality performance in developing market SMEs? Effects of resource conditions', 'https://doi.org/10.1016/j.pursup.2021.100717'],
      ['Moderating effect of supply chain complexity in governance mechanisms and operational performance relationship: Evidence from a sub Saharan African market', 'https://www.tandfonline.com/doi/abs/10.1080/23322373.2021.1927448'],
    ] as const
  ).map(([title, external_url]) => ({
    type: 'journal_article' as const,
    title,
    external_url,
    review: 'Listed on the legacy site as a journal article by CARISCA team members. Add authors, journal, year and DOI from the publisher page.',
  })),
];

// ---------------------------------------------------------------------------- LMI
/**
 * Quarterly Ghana LMI reports. Headline values are quoted from CARISCA's own news releases
 * (`value_source`); periods without a stated value are left empty rather than estimated.
 */
export const lmiReports: Array<{
  year: number;
  quarter: number;
  period_label: string;
  file_source: string;
  lmi_value?: number;
  future_lmi_value?: number;
  value_source?: string;
  indicators?: Array<{ indicator: string; label: string; value: number }>;
  review?: string;
}> = [
  { year: 2025, quarter: 2, period_label: 'April – June 2025', file_source: `${WP}/2026/02/Ghana-LMI-Report-Q2-2025.docx.pdf`, lmi_value: 57.9, future_lmi_value: 60.6, value_source: 'https://carisca.knust.edu.gh/2025-lmi-report-january-june-2025/', indicators: [{ indicator: 'inventory_levels', label: 'Inventory levels', value: 74.2 }, { indicator: 'electronic_payment_index', label: 'Electronic Payment System Index (EPI)', value: 78.8 }], review: 'The release says Q2 2025 fell "from 63", but the Q1 2025 value is stated as 63.5. Confirm both values against the PDF.' },
  { year: 2025, quarter: 1, period_label: 'January – March 2025', file_source: `${WP}/2026/02/Ghana-LMI-Report-Q1-2025.docx-2.pdf`, lmi_value: 63.5, future_lmi_value: 66.2, value_source: 'https://carisca.knust.edu.gh/2025-lmi-report-january-june-2025/', indicators: [{ indicator: 'inventory_levels', label: 'Inventory levels', value: 60.2 }, { indicator: 'electronic_payment_index', label: 'Electronic Payment System Index (EPI)', value: 76.1 }] },
  { year: 2024, quarter: 4, period_label: 'October – December 2024', file_source: `${WP}/2026/01/Ghana-LMI-Report-Q4-2024-.docx.pdf`, lmi_value: 66, value_source: 'https://carisca.knust.edu.gh/2025-lmi-report-january-june-2025/', review: 'Value taken from the Q1 2025 release ("declined slightly to 63.5 from 66"). Confirm against the PDF.' },
  { year: 2024, quarter: 3, period_label: 'July – September 2024', file_source: `${WP}/2024/12/Ghana-LMI-Report-Q3-2024.docx.pdf`, review: 'Headline value not stated on the website. Enter it from the PDF.' },
  { year: 2024, quarter: 1, period_label: 'January – March 2024', file_source: `${WP}/2024/05/Ghana-LMI-Report-Q1-2024.pdf`, review: 'Headline value not stated on the website. Enter it from the PDF.' },
  { year: 2023, quarter: 4, period_label: 'October – December 2023', file_source: `${WP}/2024/04/Ghana-LMI-Report-Q4-2023.pdf`, lmi_value: 63.3, value_source: 'https://carisca.knust.edu.gh/the-lmi-value-for-ghana-for-the-fourth-quarter-of-2023-is-63-3/' },
  { year: 2023, quarter: 3, period_label: 'July – September 2023', file_source: '', lmi_value: 63.7, value_source: 'https://carisca.knust.edu.gh/the-lmi-value-for-ghana-for-the-fourth-quarter-of-2023-is-63-3/', review: 'No Q3 2023 report PDF is linked on the legacy LMI page. Upload it if available.' },
  { year: 2023, quarter: 2, period_label: 'April – June 2023', file_source: `${WP}/2023/09/Ghana-LMI-Report-Q2-2023.pdf`, lmi_value: 64.2, future_lmi_value: 64.5, value_source: 'https://carisca.knust.edu.gh/ghanas-latest-logistics-managers-index-reveals-slight-economic-slowdown-from-boisterous-start-in-2023/', indicators: [{ indicator: 'electronic_payment_index', label: 'Electronic Payment System Index (EPI)', value: 72.9 }] },
  { year: 2023, quarter: 1, period_label: 'January – March 2023', file_source: `${WP}/2023/10/Ghana-LMI-Report-Q1-2023.pdf`, lmi_value: 67, future_lmi_value: 69.3, value_source: 'https://carisca.knust.edu.gh/ghanas-latest-logistics-managers-index-reveals-slight-economic-slowdown-from-boisterous-start-in-2023/' },
  { year: 2022, quarter: 3, period_label: 'July – September 2022', file_source: `${WP}/2023/02/Ghana-LMI-Report-Third-Quarter-2022-1.pdf`, indicators: [{ indicator: 'inventory_levels', label: 'Inventory levels', value: 43.2 }, { indicator: 'inventory_costs', label: 'Inventory costs', value: 94.2 }, { indicator: 'transportation_costs', label: 'Transportation costs', value: 97 }], value_source: 'https://carisca.knust.edu.gh/ghanas-third-logistics-managers-index-shows-contraction-in-inventory-levels/', review: 'Headline LMI not stated in the release. Enter it from the PDF.' },
  { year: 2022, quarter: 2, period_label: 'April – June 2022', file_source: `${WP}/2022/11/Ghana-LMI-Report-Second-Quarter-2022.pdf`, lmi_value: 65.9, value_source: 'https://carisca.knust.edu.gh/ghanas-second-logistics-managers-index-reveals-slow-growth-in-logistics-activities/' },
  { year: 2022, quarter: 1, period_label: 'January – March 2022', file_source: `${WP}/2022/06/Ghana-LMI-Report-First-Quarter-2022.pdf`, lmi_value: 64.7, value_source: 'https://carisca.knust.edu.gh/ghanas-first-logistics-managers-index-reveals-growth-in-logistics-activities/', review: 'The first release states 64.7; the second release refers to "the first quarter’s 64". Confirm against the PDF.' },
];

// ---------------------------------------------------------------------------- newsletters
export const newsletters = [
  { issue: 13, title: 'CARISCA Newsletter – Issue 13 (January 2026)', published_on: '2026-01-01', cover_source: `${WP}/2026/02/CARISCA-Newsletter-Issue-13.png`, file_source: `${WP}/2026/02/CARISCA-Newsletter-Issue-13-1.pdf` },
  { issue: 12, title: 'CARISCA Newsletter – Issue 12 (June 2025)', published_on: '2025-06-01', cover_source: `${WP}/2026/02/CARISCA-Newsletter-June-2025-1.png`, file_source: `${WP}/2026/02/CARISCA-Newsletter-June-2025-3.pdf` },
  { issue: 11, title: 'CARISCA Newsletter – Issue 11 (December 2024)', published_on: '2024-12-01', cover_source: `${WP}/2024/12/Untitled-design.png`, online_url: 'https://mailchi.mp/carisca/introducing-the-carisca-report-e-newsletter' },
  { issue: 10, title: 'CARISCA Newsletter – Issue 10 (May 2024)', published_on: '2024-05-01', cover_source: `${WP}/2024/06/CARISCA-REPORT-Issue-10-COVER.jpg`, file_source: `${WP}/2024/06/CARISCA-REPORT-Issue-10.pdf` },
  { issue: 9, title: 'CARISCA Newsletter – Issue 9 (November 2023)', published_on: '2023-11-01', cover_source: `${WP}/2023/12/CARISCA-REPORT-Issue-9-COVER.jpg`, file_source: `${WP}/2023/12/CARISCA-REPORT-Issue-9.pdf` },
  { issue: 8, title: 'CARISCA Newsletter – Issue 8 (June 2023)', published_on: '2023-06-01', cover_source: `${WP}/2023/06/CARISCA-REPORT-Issue-8-COVER.jpg`, file_source: `${WP}/2023/06/CARISCA-Newsletter-June-2023-issue-8.pdf` },
  { issue: 7, title: 'CARISCA Newsletter – Issue 7 (February 2023)', published_on: '2023-02-01', cover_source: `${WP}/2023/02/newsletter-7.jpg`, file_source: `${WP}/2023/02/CARISCA-Newsletter-Feb-2023-Issue-7.pdf` },
  { issue: 6, title: 'CARISCA Newsletter – Issue 6 (October 2022)', published_on: '2022-10-01', cover_source: `${WP}/2022/10/CARISCA-Newsletter-Oct-2022-Issue-6-CVRimage-1-e1665683167396.jpg`, file_source: `${WP}/2022/10/CARISCA-Newsletter-Oct-2022-Issue-6.pdf` },
  { issue: 5, title: 'CARISCA Newsletter – Issue 5 (June 2022)', published_on: '2022-06-01', cover_source: `${WP}/2022/07/newsletter-5.jpg`, file_source: `${WP}/2022/07/CARISCA-Newsletter-June-2022-Issue-5-1.pdf`, review: 'Labelled "2021-Issue-5" on the legacy site but the file is named June 2022. Confirm the issue date.' },
  { issue: 4, title: 'CARISCA Newsletter – Issue 4', published_on: '2022-03-01', cover_source: `${WP}/2022/03/4.jpg`, file_source: `${WP}/2022/03/CARISCA-Newsletter-2022-Issue-4.pdf`, review: 'Labelled "2021-Issue-4" on the legacy site but the file is named 2022. Date inferred from upload (March 2022); confirm.' },
  { issue: 3, title: 'CARISCA Newsletter – Issue 3 (2021)', published_on: '2021-10-01', cover_source: `${WP}/2022/03/3.jpg`, file_source: `${WP}/2021/10/CARISCA-Newsletter-Issue-3.pdf`, review: 'Month inferred from the file upload date; confirm.' },
  { issue: 2, title: 'CARISCA Newsletter – Issue 2 (2021)', published_on: '2021-06-01', cover_source: `${WP}/2022/03/2.jpg`, file_source: `${WP}/2021/06/CARISCA-Newsletter-2021-Issue-2.pdf`, review: 'Month inferred from the file upload date; confirm.' },
  { issue: 1, title: 'CARISCA Newsletter – Issue 1 (2021)', published_on: '2021-05-01', cover_source: `${WP}/2022/03/EDITION-1.jpg`, file_source: `${WP}/2021/05/CARISCA-Newsletter-2021-Issue-1.pdf`, review: 'Month inferred from the file upload date; confirm.' },
];

// ---------------------------------------------------------------------------- CPD & ISCEA
export const cpdProgrammes = [
  {
    slug: 'designing-and-delivering-circular-supply-chains',
    title: 'Designing and Delivering Circular Supply Chains for Success in African Markets',
    summary:
      'A one-day continuous professional development workshop that equips professionals with practical tools, frameworks, and strategies for designing and implementing circular supply chains tailored to African markets.',
    description:
      '<h2>Why attend?</h2><p>Circular supply chains are becoming essential for organisations seeking to reduce waste, improve resource efficiency, and build resilient business models.</p><p>This one-day continuous professional development workshop equips professionals with practical tools, frameworks, and strategies for designing and implementing circular supply chains tailored to African markets.</p>',
    facilitators:
      'Dr Simon Peter Nadeem — Senior Program Manager with LEARN Logistics by the Kuehne Foundation, where he oversees the PhD programme across several countries in Africa, supports the CARISCA Research Centre in Ghana, and leads the development of academic research activities across the region. His last academic role was Senior Lecturer (Associate Professor) at the University of Derby, United Kingdom. His expertise spans Operations Management, Logistics and Supply Chain Management, Circular Economy, Sustainability, and Business Process Reengineering.',
    duration: 'One day',
    delivery_format: 'In-person (Accra) & Online (Zoom)',
    fee_text: 'In-person: GH¢1,500 · Virtual: GH¢1,000',
    registration_url: 'https://cpd.carisca.org/',
    image_source: `${WP}/2026/06/Designing-and-Delivering-Circular-Supply-Chains-For-Success-in-African-Markets-1.png`,
    sessions: [
      {
        starts_at: '2026-07-09T09:00:00Z',
        venue: 'Accra (in person) and online via Zoom',
        delivery_mode: 'hybrid' as const,
        fee_text: 'In-person: GH¢1,500 · Virtual: GH¢1,000',
        registration_status: 'closed' as const,
        registration_url: 'https://cpd.carisca.org/',
      },
    ],
    review: 'Session start time not stated on the legacy site (date only). The session date has passed.',
  },
  {
    slug: 'sustaining-cost-effective-resilient-supply-chains',
    title: 'Sustaining Cost-Effective, Resilient Supply Chains',
    summary:
      'Supply chain disruptions are inevitable and can threaten organisational performance and continuity. This workshop provides practical frameworks to help organisations design resilient supply chains while maintaining operational efficiency and cost-effectiveness.',
    description: null,
    facilitators: null,
    duration: 'One day (9:00 am – 3:00 pm)',
    delivery_format: null,
    fee_text: 'GH¢1,000',
    registration_url: null,
    image_source: `${WP}/2026/04/CPDS-5.png`,
    sessions: [
      {
        starts_at: '2026-06-03T09:00:00Z',
        ends_at: '2026-06-03T15:00:00Z',
        venue: null,
        delivery_mode: 'in_person' as const,
        fee_text: 'GH¢1,000',
        registration_status: 'closed' as const,
        registration_url: null,
      },
    ],
    review: 'Imported from the 3 June 2026 event listing. Add learning objectives, facilitator and venue from the legacy page /sustaining-cost-effective-resilient-supply-chains/.',
  },
];

export const isceaProgrammes = [
  { code: 'CSCA', name: 'Certified Supply Chain Analyst', cost: '$1,100', brochure: `${WP}/2026/03/CSCA.pdf`, description: 'Designed to provide you the opportunity to demonstrate your mastery of the body of knowledge relating to the basics of the supply chain.' },
  { code: 'CPLM', name: 'Certified Professional in Logistics Management', cost: '$1,400', brochure: `${WP}/2026/03/CPLM.pdf`, description: 'Designed to help logistics professionals demonstrate a deep understanding of the concepts and skills of modern logistics management.' },
  { code: 'CSSCP', name: 'Certified Sustainable Supply Chain Professional', cost: '$1,600', brochure: `${WP}/2026/03/CSSCP.pdf`, description: 'A comprehensive education programme that integrates sustainability into supply chain principles.' },
  { code: 'CHSCA', name: 'Certified Healthcare Supply Chain Analyst', cost: '$1,100', brochure: `${WP}/2026/03/CHSCA.pdf`, description: 'Focuses on the delivery of healthcare products and services to the right place, at the right time and at the right price.' },
];

// ---------------------------------------------------------------------------- homepage slides
export const slides = [
  {
    title: 'Strong Supply Chains, Strong Communities',
    caption: 'Centre for Applied Research and Innovation in Supply Chain – Africa, at the Kwame Nkrumah University of Science and Technology.',
    image_source: `${WP}/2025/07/0X3A0297-scaled.jpg`,
    image_alt: 'CARISCA event participants',
    button_label: 'About CARISCA',
    button_url: '/about',
    secondary_label: 'Our research',
    secondary_url: '/research',
    review: 'Add a precise description of the hero photograph as alternative text.',
  },
  {
    title: 'Research that strengthens Africa’s supply chains',
    caption: 'Industry reports, policy briefs, journal articles and the Ghana Logistics Managers Index.',
    image_source: `${WP}/2026/01/banner-scaled.jpg`,
    image_alt: 'CARISCA banner',
    button_label: 'Publications & resources',
    button_url: '/publications',
    secondary_label: 'Ghana LMI',
    secondary_url: '/lmi',
    review: 'Add a precise description of the banner image as alternative text.',
  },
];
