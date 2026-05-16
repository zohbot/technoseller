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
- `src/lib/search.mjs`: vendor filtering and summary logic
- `public/assets`: approved generated image assets

The interface now uses React, Vite, Tailwind CSS, Radix primitives, and lucide
icons. Its component direction follows shadcn-style composition with command
search, segmented saved views, drawer-style advanced filters, active filter
pills, compact result controls, and merchant/admin density.

## Runtime Flow

1. The browser loads the Vite-built React app from `dist`.
2. `App.tsx` requests `/api/taxonomy` for filters and summary metrics.
3. Directory searches call `/api/vendors` with query, saved-view, filter, score, response, and sort parameters.
4. Vendor profile routes use `/vendors/:slug` on the client and `/api/vendors/:slug` for data.
5. Buyer inquiries post to `/api/leads`.
6. The admin queue reads `/api/admin/leads` and updates statuses with `PATCH`.

## Data Model

The current model is intentionally small but production-shaped:

- `vendor`: identity, regions, services, trust status, rating, response time, capabilities, and opportunity tags
- `lead`: buyer company, contact details, need, target vendor, timeline, status, and timestamp
- `taxonomy`: supported regions, service categories, and verification statuses

The current demo seed includes 10 fictional vendors across 8 regions, 8 service
lines, and 4 seeded moderation leads. Generated image assets support the
operations workspace, compliance review, supplier discovery, lead routing, and
regional intelligence sections.

## Production Upgrade Path

- Move synthetic data to PostgreSQL or another durable database.
- Add authentication and role-based access for buyers, vendors, and operators.
- Add full-text search or a hosted search service for larger directories.
- Persist lead moderation status with audit history.
- Add vendor onboarding, verification workflows, and abuse prevention.
- Add transactional email for inquiry confirmation and operator alerts.

## Privacy Boundary

This project must not include private archive files or unapproved legacy assets. Only synthetic data, original UI code, and explicitly approved derivative assets should be committed.
