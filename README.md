# Brand Growth Ecosystem — Ascendra Technologies

A Next.js (App Router) site for the **Brand Growth** ecosystem: three partners (Ascendra Technologies, Macon Designs, Style Studio Branding) with a funnel-led homepage, strategy-call flow, and partner authority pages.

## Tech stack

- **Frontend:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **State / data:** React Query, shared CTA config (`app/lib/funnelCtas.ts`)
- **Forms:** react-hook-form, Zod
- **Motion:** Framer Motion (hero, sections; respects `prefers-reduced-motion`)
- **Deployment:** Vercel (see [Docs/deployment](Docs/deployment))

## Project structure

- **Homepage (`/`):** Funnel-led hero (“Build a Brand That Converts Customers”), primary CTA → Brand Growth Plan, secondary → Strategy Call. No projects/skills on home.
- **Brand Growth hub:** `/brand-growth` — path selector (Launch / Rebrand / Marketing Assets), 3-pillar solution, process, CTAs.
- **Funnel paths:** `/launch-your-brand`, `/rebrand-your-business`, `/marketing-assets` — persona-focused landings with FAQ and strategy-call CTAs.
- **Strategy flow:** `/strategy-call` (form) → `/call-confirmation` (thank-you + prep checklist).
- **Partners:** `/partners/ascendra-technologies`, `/partners/macon-designs`, `/partners/style-studio-branding` — authority pages with brand accents.
- **Persona landings:** `/contractor-systems`, `/local-business-growth`, `/startup-mvp-development` — use shared `FaqSection`; CTAs to audit and strategy call.
- **Other:** `/audit`, `/blog`, `/assessment`, `/faq`, `/resume`, contact section, admin/dashboard (unchanged).

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Documentation

All project documentation lives in the **[Docs](Docs/)** folder:

- **Audits & strategy:** [Docs/audits](Docs/audits) — Phase 1 ecosystem audit, conversion funnel audit, wireframe & copy system.
- **Deployment:** [Docs/deployment](Docs/deployment) — Vercel (static/serverless), production checklist.
- **Implementation:** [Docs/implementation](Docs/implementation) — Assessment workflow, notifications, services, update posts.
- **Reference:** [Docs/reference](Docs/reference) — Security, credentials, admin scripts.
- **Archive:** [Docs/archive](Docs/archive) — Migration, cleanup, and fix logs.

See **[Docs/README.md](Docs/README.md)** for the full index and links.

## Security

- Never commit secrets. Use `.env.local` for local config and follow [Docs/reference/SECURITY.md](Docs/reference/SECURITY.md).
