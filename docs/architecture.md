# Architecture

## Product Goal

TECHNOseller Portal models a credible B2B marketplace where buyers can discover vendors by service, region, operational capability, and trust status. It is built as a public showcase concept with clean synthetic data.

## Current Stack

- `server.mjs`: Node HTTP server for the JSON API and built frontend assets
- `vite.config.ts`: Vite, React, and Tailwind CSS build configuration
- `src/App.tsx`: React application shell, routing, marketplace UI, and lead interactions
- `src/main.tsx`: React entrypoint
- `src/styles.css`: Tailwind CSS entrypoint and global tokens
- `src/data/marketplace.mjs`: synthetic marketplace seed data
- `src/data/artifacts.mjs`: synthetic demo artifact metadata
- `src/lib/search.mjs`: vendor filtering and summary logic
- `src/lib/db.mjs`: Prisma-backed repository for vendors, leads, users, and sessions
- `prisma/schema.prisma`: SQLite development schema with a migration path to Postgres
- `prisma/migrations`: versioned database schema migrations
- `public/assets`: approved generated image assets
- `public/demo-artifacts`: synthetic downloadable demo files

The interface now uses React, Vite, Tailwind CSS, Radix primitives, and lucide
icons. Its component direction follows shadcn-style composition with command
search, segmented saved views, drawer-style advanced filters, active filter
pills, compact result controls, an avatar/profile dropdown, operator KPI
widgets, workflow pipeline, activity feed, and merchant/admin density.

## Frontend / Backend Split

The Node server owns JSON APIs, demo auth sessions, Prisma database access, and production static asset
serving. During development, `npm run dev:backend` can run the backend on
`4173`, while `npm run dev:frontend` starts Vite on `5173` and proxies `/api`
requests to the backend. This keeps database management and future backend
services independent from the React frontend.

## Runtime Flow

1. The browser loads the Vite-built React app from `dist`.
2. On startup, `server.mjs` seeds the SQLite database from synthetic source data when records are missing.
3. `App.tsx` requests `/api/taxonomy` for filters and database-backed summary metrics.
4. The artifact vault requests `/api/artifacts` for downloadable demo files and deal-room metadata.
5. Directory searches call `/api/vendors` with query, saved-view, filter, score, response, and sort parameters.
6. Vendor profile routes use `/vendors/:slug` on the client and `/api/vendors/:slug` for data.
7. Buyer inquiries post to `/api/leads` and persist in SQLite.
8. Demo login creates a `User` and `Session` record and returns an HTTP-only cookie.
9. The admin queue reads `/api/admin/leads` and updates persisted statuses with `PATCH`; both routes require the demo `admin` role.

## Security Flow

The backend applies baseline browser security headers to API and static
responses, limits JSON request bodies, trims and validates lead intake fields,
rate-limits login and lead submission routes, and avoids returning exception
details to clients. Admin moderation data is no longer public; the frontend
shows a protected admin prompt until a user signs in with the demo `admin`
username.

## Data Model

The current model is intentionally small but production-shaped:

- `Vendor`: identity, regions, services, trust status, rating, response time, capabilities, and opportunity tags
- `Lead`: buyer company, contact details, need, target vendor, timeline, moderation status, and timestamps
- `User`: demo operator identity and role
- `Session`: database-backed dummy auth session with expiration
- `artifact`: synthetic verification packets, compliance briefs, CSV reports, and JSON exports exposed as public-safe demo files
- `taxonomy`: supported regions, service categories, and verification statuses

The current demo seed includes 10 fictional vendors across 8 regions, 8 service
lines, and 4 seeded moderation leads. Generated image assets support the
operations workspace, compliance review, supplier discovery, lead routing, and
regional intelligence sections.

## Production Upgrade Path

- Move SQLite development storage to PostgreSQL for hosted production.
- Add authentication and role-based access for buyers, vendors, and operators.
- Add full-text search or a hosted search service for larger directories.
- Add lead moderation audit history.
- Add vendor onboarding, verification workflows, and abuse prevention.
- Add transactional email for inquiry confirmation and operator alerts.

## Privacy Boundary

This project must not include private archive files or unapproved legacy assets. Only synthetic data, original UI code, and explicitly approved derivative assets should be committed.
