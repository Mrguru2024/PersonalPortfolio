export type EcosystemPartnerProject = {
  id: string;
  title: string;
  description: string;
  tags: string[];
};

/** Macon Designs (Denishia Macon-Lynn) — projects from Behance portfolio */
export const MACON_PROJECTS: EcosystemPartnerProject[] = [
  { id: "social-media-branding-kits", title: "Social Media Branding Kits", description: "Cohesive visual systems for social channels—templates, assets, and guidelines for consistent brand presence.", tags: ["Brand identity", "Social media", "Visual systems"] },
  { id: "wwe-promo-motion", title: "WWE-Inspired Promo & Motion Graphics", description: "Promo and motion graphics for events and campaigns. Bold typography and dynamic visuals.", tags: ["Motion graphics", "Promo", "Event branding"] },
  { id: "hbo-production", title: "HBO Production Work", description: "Design and production for broadcast and entertainment. Professional presentation and brand alignment.", tags: ["Production design", "Broadcast", "Entertainment"] },
  { id: "conference-branding", title: "Conference & Event Branding", description: "Full branding for conferences including National Business League, National Urban League, and National Black Business events.", tags: ["Event branding", "Conference", "Identity systems"] },
  { id: "sc250-exhibit", title: "SC250 Revolutionary War Exhibit Banner", description: "Exhibit and environmental graphics. Historical and institutional visual storytelling.", tags: ["Exhibit design", "Environmental", "Institutional"] },
  { id: "harp-method-branding", title: "HARP Method Branding — G. Patrick Griffin", description: "Brand identity and visual system for the HARP Method. Strategy-led design for professional positioning.", tags: ["Brand identity", "Visual systems", "Professional services"] },
];

/** Style Studio Branding (Kristopher Williams) — projects from Behance portfolio */
export const STYLE_STUDIO_PROJECTS: EcosystemPartnerProject[] = [
  { id: "scecep-empowerment", title: "SCECEP Empowerment Program", description: "Program branding and visual identity for the SCECEP Empowerment Program. Clear, professional presentation for community and education initiatives.", tags: ["Program branding", "Visual identity", "Education"] },
  { id: "osaic-presentations", title: "Osaic corporate materials", description: "Powerpoint presentations, facts questionnaires, bond credit ratings booklet, social media program sheets, and institutions data sheets. Corporate design at scale.", tags: ["Corporate design", "Presentations", "Print"] },
  { id: "dekalb-school-flyer", title: "Dekalb County School Flyer / Brochure", description: "Flyer and brochure design for Dekalb County Schools. Clean layout and on-brand messaging for education and outreach.", tags: ["Print design", "Brochure", "Education"] },
  { id: "louisiana-housing-conference", title: "Louisiana Housing Conference", description: "Conference branding and marketing materials. Event identity and collateral for the Louisiana Housing Conference.", tags: ["Conference branding", "Event design", "Marketing"] },
  { id: "traveling-blackboard", title: "Traveling Blackboard Marketing Project", description: "Marketing campaign and visual assets for the Traveling Blackboard initiative. Campaign-driven design for engagement.", tags: ["Campaign design", "Marketing", "Visual assets"] },
  { id: "back2basics-foundation", title: "Back 2 Basics Business Foundation", description: "Brand and visual materials for the Back 2 Basics Business Foundation. Strategic design for business and community programs.", tags: ["Brand identity", "Business", "Foundation"] },
];

export const BEHANCE_MACON_URL = "https://www.behance.net/macondesigns";
export const BEHANCE_STYLE_STUDIO_URL = "https://www.behance.net/kwilliams7";

export const ECOSYSTEM_LOGOS = {
  maconBadge: "/Ascendra images/logomacondesigns/Macon Designs_Logo_Tagline_Badge.png",
  ascendra: "/ascendra-logo.svg",
  styleStudioLight: "/Ascendra images/Stylestudiologos/StyleStudio_Blk_Rd_.png",
  styleStudioDark: "/Ascendra images/Stylestudiologos/StyleStudio_Wt_Rd_.png",
} as const;
