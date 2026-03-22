/** Shared placeholder and short example strings for admin forms (import where needed). */
export const ADMIN_PLACEHOLDERS = {
  companyName: "e.g. Acme Design Studio",
  websiteUrl: "https://example.com",
  industry: "e.g. SaaS, local services, healthcare",
  accountNotes: "Internal summary — your team sees this on the account in CRM.",
  announcementTitle: "e.g. Phase 2 kickoff — new timeline",
  announcementBody:
    "Short, friendly update. Clients see this text on their dashboard — avoid internal jargon.",
  announcementExpires: "Leave empty to keep the update until you remove it.",
  emailSubject: "e.g. March tips, one clear benefit + optional urgency",
  emailPreviewInput: "e.g. Inside: 3 quick wins you can ship today",
  emailPreviewHint:
    "Shows under the subject in Gmail, Outlook, and Apple Mail — often decides if people open the email.",
  adminReply:
    "e.g. Thanks for writing in — here is what we changed and what to try next…",
} as const;

export const INDUSTRY_SUGGESTIONS = [
  "SaaS",
  "E-commerce",
  "Healthcare",
  "Professional services",
  "Local services",
  "Manufacturing",
  "Education",
  "Nonprofit",
  "Agency",
] as const;
