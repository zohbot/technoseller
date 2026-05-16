# TECHNOseller Portal

<p align="center">
  <img src="docs/screenshots/directory-desktop-crop.png" alt="TECHNOseller Portal desktop directory preview" width="100%">
</p>

TECHNOseller Portal is a standalone public SaaS concept for vendor discovery, service search, buyer lead capture, and marketplace moderation.

The project is inspired by the structure of an old private template archive, but it does not include or publish private archive files. All marketplace content in this repo is synthetic and safe for public demonstration.

## What It Includes

- Responsive marketplace directory frontend
- Production React frontend powered by Vite, Tailwind CSS, Radix primitives, and lucide icons
- Node HTTP backend with JSON API endpoints
- Original AI-generated hero, verification, and logo concept assets
- TECHNOseller palette: Tuscan Sun, Onyx, Platinum, Vivid Royal, and Prussian Blue
- Expanded synthetic vendors, services, regions, capabilities, opportunities, and moderation leads
- Premium command-style search with Radix tabs, Radix select controls, active filters, advanced drawer, and sorting
- Vendor profile routes at `/vendors/:slug`
- Buyer lead submission flow
- Admin moderation queue with lead status updates
- Architecture notes and layout schema
- No required third-party runtime dependencies

## Run Locally

```bash
npm install
npm run build
npm start
```

Then open:

```text
http://127.0.0.1:4173
```

Use a custom port:

```bash
PORT=5000 node server.mjs
```

On PowerShell:

```powershell
$env:PORT=5000; node server.mjs
```

## Test

```bash
npm test
```

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/taxonomy` | Regions, services, statuses, and summary metrics |
| `GET` | `/api/vendors` | Searchable vendor directory |
| `GET` | `/api/vendors/:slug` | Vendor profile data |
| `POST` | `/api/leads` | Submit buyer inquiry |
| `GET` | `/api/admin/leads` | Review lead queue |
| `PATCH` | `/api/admin/leads/:id` | Update lead moderation status |

## Privacy Position

This repo is public-safe by design:

- No private archive files are included.
- No copied legacy images are used.
- Vendor and lead data are synthetic examples.
- The included visual assets are newly generated for this project.
- Any future legacy-inspired assets should be approved, cleaned, and derivative before being committed.

## Visual Assets

Generated project assets live in `public/assets`:

- `marketplace-command-center.png`
- `verification-workflow.png`
- `technoseller-logo-concept.png`
- `operations-workspace.png`
- `compliance-review.png`
- `supplier-discovery.png`
- `lead-routing-console.png`
- `regional-network.png`

The current screenshots in `docs/screenshots` show the enhanced desktop, mobile, and vendor profile layouts.

## Interface Direction

The frontend now uses a production-grade React/Vite/Tailwind foundation with shadcn-style component composition, Radix primitives for tabs, selects, and dialogs, and denser merchant/admin patterns inspired by Square and Polaris. The directory uses a horizontal command search, saved resource views, filter chips, an advanced drawer, active pills, and compact result controls.

## Future Production Path

A production version could move this concept to Next.js, Remix, or a similar full-stack framework, then add authenticated vendor accounts, a database, search indexing, audit trails, moderation roles, and email delivery.
