# Security Posture

TECHNOseller Portal is a public showcase project, but the backend is shaped to
avoid the most common prototype risks as it moves toward a production app.

## Implemented Controls

- Admin lead review routes require an authenticated `admin` demo session.
- Demo sessions are stored in the database and delivered with `HttpOnly`,
  `SameSite=Lax` cookies.
- Production cookies add the `Secure` attribute when `NODE_ENV=production`.
- API responses include baseline security headers:
  - `Content-Security-Policy`
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Cross-Origin-Resource-Policy`
- JSON request bodies are capped at 64 KB.
- Login and lead submission routes include simple per-client rate limits.
- Lead intake fields are trimmed, length-limited, email-validated, and checked
  against known vendor slugs before persistence.
- Static asset serving validates resolved paths stay inside the built app root.
- Server errors no longer expose internal exception details to API clients.
- SQLite development databases and local environment files are ignored by Git.

## Remaining Production Work

- Replace dummy username login with a real identity provider or passwordless
  auth flow.
- Add CSRF protection before expanding cookie-authenticated mutation routes.
- Add audit history for moderation actions.
- Add role and permission tables instead of the current demo role string.
- Move hosted deployments to Postgres and run migrations through CI/CD.
- Add structured request logging, alerting, and backup/restore procedures.
- Add abuse prevention for contact forms, such as CAPTCHA or email verification,
  before exposing the app to the public internet.

## Local Review Commands

```bash
npm audit
npm test
npm run build
```
