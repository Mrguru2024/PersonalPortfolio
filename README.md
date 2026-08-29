# Brand Growth Ecosystem — Ascendra Technologies

A Next.js (App Router) site for the **Brand Growth** ecosystem: three partners (Ascendra Technologies, Macon Designs, Style Studio Branding) with a funnel-led homepage, strategy-call flow, and partner authority pages.

## Features

### 🚀 Core Capabilities

- **Full-Stack CMS**: Next.js 16 with React 19, Tailwind CSS, Drizzle ORM, PostgreSQL
- **Progressive Web App**: Offline support for project data, cached shell, background sync
- **Real-Time Collaboration**: WebSocket-based presence, live markup, cursor tracking at crew scale
- **Enterprise Controls**: AI policy management, rate limiting, audit logging, backup/restore
- **Queue System**: Redis (primary) or Postgres (fallback) job processing with priority queues
- **iPad Optimization**: Apple Pencil support with haptics, pressure, tilt, and gestures
- **CV/ML Analytics**: Tape-reader chart analysis with OpenAI integration

### 🎨 Collaboration Features

- **Live Presence**: Real-time user presence tracking on documents and sheets
- **Cursor Tracking**: See collaborator cursors with color-coded identifiers
- **Live Markup**: Comment threads, annotations, and collaborative editing
- **WebSocket Pub/Sub**: Scalable real-time broadcasting (replaces long-poll SSE)

### 🏢 Enterprise Features

- **AI Policy Controls**: Organization-level AI on/off, model restrictions, usage limits
- **Rate Limiting**: Upstash Redis-backed rate limiting at the edge
- **Audit Logging**: Track all AI usage, requests, and policy violations
- **Backup & Restore**: Automated database backups with restore drill testing
- **Queue Drain**: Graceful queue processing under high load

### 📱 Progressive Web App

- **Offline Mode**: Access project data without connectivity
- **Background Sync**: Automatic data sync when connection restored
- **Install Prompts**: Native app-like experience on mobile and desktop
- **Service Worker**: Smart caching with cache-first/network-first strategies

### ✏️ iPad & Apple Pencil

- **Pressure Sensitivity**: Dynamic stroke width based on pressure (0.0-1.0)
- **Tilt Detection**: Capture tilt angles for shading effects
- **Haptic Feedback**: Light/medium/heavy haptics for touch interactions
- **Multi-Touch Gestures**: Pinch, zoom, rotate, double-tap, long-press

### 📊 Analytics & Intelligence

- **Tape Reader CV/ML**: Chart pattern recognition and technical analysis
- **Growth OS Intelligence**: Market research and opportunity scoring (AMIE)
- **Behavior Tracking**: Visitor analytics and conversion intelligence
- **CRM Integration**: Contact management with outreach automation

## Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **State / data:** React Query, shared CTA config (`app/lib/funnelCtas.ts`)
- **Forms:** react-hook-form, Zod
- **Motion:** Framer Motion (hero, sections; respects `prefers-reduced-motion`)
- **Database:** PostgreSQL with Drizzle ORM, `@neondatabase/serverless`
- **Real-time:** WebSocket (ws), Redis pub/sub for multi-instance scaling
- **Queue:** Redis (Upstash) or Postgres fallback with retry/priority support
- **Cache:** Upstash Redis for rate limiting and ephemeral data
- **Deployment:** Vercel (see [Docs/deployment](Docs/deployment))

## Project structure

- **Homepage (`/`):** Funnel-led hero ("Build a Brand That Converts Customers"), primary CTA → Brand Growth Plan, secondary → Strategy Call. No projects/skills on home.
- **Brand Growth hub:** `/brand-growth` — path selector (Launch / Rebrand / Marketing Assets), 3-pillar solution, process, CTAs.
- **Funnel paths:** `/launch-your-brand`, `/rebrand-your-business`, `/marketing-assets` — persona-focused landings with FAQ and strategy-call CTAs.
- **Strategy flow:** `/strategy-call` (form) → `/call-confirmation` (thank-you + prep checklist).
- **Partners:** `/partners/ascendra-technologies`, `/partners/macon-designs`, `/partners/style-studio-branding` — authority pages with brand accents.
- **Persona landings:** `/contractor-systems`, `/local-business-growth`, `/startup-mvp-development` — use shared `FaqSection`; CTAs to audit and strategy call.
- **Persona journey:** `/journey` — self-select path, lead magnets, optional offer teaser from `site_offers` (`npm run db:seed` seeds `startup-growth-system`). Home links in `#persona-journey`.
- **Other:** `/audit`, `/blog`, `/assessment`, `/faq`, `/resume`, contact section, admin/dashboard (unchanged).

## Development

```bash
# Install dependencies
npm install

# Run development server (Webpack - recommended)
npm run dev

# Run with Turbopack (experimental)
npm run dev:turbo

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check

# Run tests
npm test
```

## New Feature Setup

### Real-Time Collaboration

The collaboration system uses WebSocket for pub/sub messaging. To enable:

```typescript
// Client usage:
import { useCollaboration } from '@/app/lib/hooks/useCollaboration';

const { connected, users, markups, updateCursor, createMarkup } = useCollaboration({
  resourceType: 'document',
  resourceId: 'doc-123',
  userId: currentUser.id,
  username: currentUser.username,
});
```

### Queue System

Configure queue provider via environment variable:

```bash
# Use Redis (recommended for multi-instance)
QUEUE_PROVIDER=redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Or fall back to Postgres
QUEUE_PROVIDER=postgres
DATABASE_URL=postgresql://...
```

Usage:

```typescript
import { getQueueAdapter } from '@/server/queue';

const queue = await getQueueAdapter();
await queue.enqueue('send-email', { to: 'user@example.com' }, { priority: 10 });
```

### Enterprise AI Controls

```typescript
import { enterpriseAiPolicy } from '@/server/services/enterprise-ai-policy';

const { allowed, reason } = await enterpriseAiPolicy.checkAndEnforcePolicy({
  orgId: 'org_123',
  userId: user.id,
  model: 'gpt-4',
  action: 'chat-completion',
});
```

### PWA / Offline Support

```typescript
import { usePWA } from '@/app/lib/hooks/usePWA';

const { isOnline, cacheProjectData } = usePWA();
cacheProjectData('project-123', projectData);
```

### iPad Pencil Support

```typescript
import { useIPadPencil } from '@/app/lib/hooks/useIPadPencil';

const { canvasRef, isDrawing, triggerHaptic } = useIPadPencil({
  onDraw: (event) => {
    const { x, y, pressure, tiltX, tiltY, twist, type } = event;
    // Handle drawing with pressure and tilt
  },
  enableHaptics: true,
  enablePressure: true,
  enableTilt: true,
});
```

See [docs/ipad-touch-optimization.md](docs/ipad-touch-optimization.md) for full details.

### Tape Reader CV/ML Analyzer

```typescript
import { tapeReaderAnalyzer } from '@/server/services/tape-reader-analyzer';

const analysis = await tapeReaderAnalyzer.analyzeChart(chartData, {
  symbol: 'AAPL',
  timeframe: '1H',
});
```

## Documentation

All project documentation lives in the **[Docs](Docs/)** folder:

- **Audits & strategy:** [Docs/audits](Docs/audits) — Phase 1 ecosystem audit, conversion funnel audit, wireframe & copy system.
- **Deployment:** [Docs/deployment](Docs/deployment) — Vercel (static/serverless), production checklist.
- **Implementation:** [Docs/implementation](Docs/implementation) — Assessment workflow, notifications, services, update posts.
- **Reference:** [Docs/reference](Docs/reference) — Security, credentials, admin scripts.
- **Archive:** [Docs/archive](Docs/archive) — Migration, cleanup, and fix logs.
- **iPad Optimization:** [docs/ipad-touch-optimization.md](docs/ipad-touch-optimization.md) — Apple Pencil integration guide.

See **[Docs/README.md](Docs/README.md)** for the full index and links.

## Architecture

### Database Schema

Key tables for new features:

- `queue_jobs`: Job queue for Redis/Postgres adapter
- `collaboration_presence`: Real-time user presence tracking
- `collaboration_markup`: Comments and annotations
- `enterprise_ai_policy`: Organization AI policies
- `enterprise_ai_audit_log`: AI usage audit trail
- `enterprise_backups`: Backup metadata and restore history

Run migrations:

```bash
npm run db:push
```

### Service Layer

- **Queue:** `server/queue/` — Redis/Postgres adapters with priority queues
- **Collaboration:** `server/services/collaboration-service.ts` — WebSocket pub/sub
- **Enterprise AI:** `server/services/enterprise-ai-policy.ts` — Policy enforcement
- **Backup:** `server/services/enterprise-backup.ts` — Database backup/restore
- **Analytics:** `server/services/tape-reader-analyzer.ts` — CV/ML chart analysis

### Client Hooks

- `useCollaboration` — Real-time collaboration with presence and markup
- `usePWA` — Service worker management and offline capabilities
- `useIPadPencil` — Apple Pencil with pressure, tilt, and haptics

### API Routes

- `/api/collaboration/ws` — WebSocket endpoint for real-time collaboration
- `/api/queue/*` — Queue management and job monitoring
- `/api/enterprise/policy` — AI policy configuration
- `/api/enterprise/backups` — Backup creation and restore drills

## Environment Variables

Required for new features:

```bash
# Queue System
QUEUE_PROVIDER=redis|postgres
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
QUEUE_KEY_PREFIX=ascendra:queue

# Enterprise
ENTERPRISE_ORG_ID=org_123

# Backup/Restore
BACKUP_DIR=/var/backups/ascendra

# OpenAI (for CV/ML analyzer)
OPENAI_API_KEY=sk-...
```

See `.env.example` for complete list.

## Security

- Never commit secrets. Use `.env.local` for local config and follow [Docs/reference/SECURITY.md](Docs/reference/SECURITY.md).
- Enterprise AI policies enforce rate limits and model restrictions at the edge.
- Backup files are encrypted and stored securely with retention policies.
- Real-time collaboration requires authenticated WebSocket connections.

## Performance

- **Queue Processing**: Redis supports 10,000+ jobs/sec; Postgres fallback handles 100+ jobs/sec
- **Collaboration**: WebSocket pub/sub scales to 1,000+ concurrent users per instance
- **PWA**: Service worker caches reduce API calls by 60-80% for returning users
- **iPad Rendering**: 120Hz ProMotion support with RAF-optimized drawing

## Browser Support

- **Modern Browsers**: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- **iPad/iOS**: Safari 13.4+ (full Apple Pencil support in iPadOS 13.4+)
- **PWA**: Chrome, Edge, Safari (install prompt), Firefox (partial)
- **WebSocket**: All modern browsers

## License

MIT
