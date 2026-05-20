import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { artifacts } from "./src/data/artifacts.mjs";
import { taxonomy } from "./src/data/marketplace.mjs";
import {
  createLead,
  createLoginSession,
  deleteSession,
  getMarketplaceSummary,
  getSessionUser,
  getVendor,
  listLeads,
  listVendors,
  seedDatabase,
  updateLeadStatus
} from "./src/lib/db.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const distDir = resolve(__dirname, "dist");
const publicDir = existsSync(distDir) ? distDir : resolve(__dirname, "public");
const port = Number(process.env.PORT || 4173);
const databaseReady = seedDatabase();
const maxJsonBodyBytes = 64 * 1024;
const rateLimitWindowMs = 15 * 60 * 1000;
const rateLimitBuckets = new Map();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg"
};

const securityHeaders = {
  "content-security-policy":
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; form-action 'self'",
  "cross-origin-resource-policy": "same-origin",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "x-permitted-cross-domain-policies": "none"
};

function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, {
    ...securityHeaders,
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...headers
  });
  response.end(JSON.stringify(payload, null, 2));
}

function notFound(response) {
  sendJson(response, 404, { error: "Not found" });
}

async function readBody(request) {
  const chunks = [];
  let byteLength = 0;
  for await (const chunk of request) {
    byteLength += chunk.length;
    if (byteLength > maxJsonBodyBytes) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, ...value] = part.split("=");
        return [key, decodeURIComponent(value.join("="))];
      })
  );
}

async function getRequestUser(request) {
  const cookies = parseCookies(request.headers.cookie || "");
  const sessionId = cookies.technoseller_session;
  return getSessionUser(sessionId);
}

async function requireAdmin(request, response) {
  const user = await getRequestUser(request);
  if (!user) {
    sendJson(response, 401, { error: "Authentication required." });
    return null;
  }
  if (user.role !== "admin") {
    sendJson(response, 403, { error: "Admin access required." });
    return null;
  }
  return user;
}

function sessionCookie(sessionId) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `technoseller_session=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${secure}`;
}

function expiredSessionCookie() {
  return "technoseller_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}

function clientKey(request) {
  const forwardedFor = String(request.headers["x-forwarded-for"] || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)[0];
  return forwardedFor || request.socket.remoteAddress || "unknown";
}

function checkRateLimit(request, bucketName, limit) {
  const now = Date.now();
  const key = `${bucketName}:${clientKey(request)}`;
  const current = rateLimitBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return null;
  }

  current.count += 1;
  if (rateLimitBuckets.size > 1000) {
    for (const [itemKey, bucket] of rateLimitBuckets) {
      if (bucket.resetAt <= now) rateLimitBuckets.delete(itemKey);
    }
  }

  if (current.count > limit) {
    return Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  }

  return null;
}

function trimField(input, key) {
  return String(input?.[key] || "").trim();
}

function tooLong(input, key, maxLength) {
  return trimField(input, key).length > maxLength;
}

function validateUsername(username) {
  if (!username) return "Username is required.";
  if (username.length < 2 || username.length > 40) {
    return "Username must be between 2 and 40 characters.";
  }
  if (!/^[a-zA-Z0-9._ -]+$/.test(username)) {
    return "Username can only include letters, numbers, spaces, dots, underscores, and hyphens.";
  }
  return null;
}

async function validateLead(input) {
  const required = ["vendorSlug", "company", "name", "email", "need", "timeline"];
  const missing = required.filter((key) => !trimField(input, key));
  const email = trimField(input, "email").toLowerCase();
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (missing.length) {
    return { ok: false, error: `Missing fields: ${missing.join(", ")}` };
  }
  if (
    tooLong(input, "company", 120) ||
    tooLong(input, "name", 120) ||
    tooLong(input, "email", 160) ||
    tooLong(input, "timeline", 80) ||
    tooLong(input, "need", 1200)
  ) {
    return { ok: false, error: "One or more fields exceed the allowed length." };
  }
  if (!emailLooksValid) {
    return { ok: false, error: "A valid email address is required." };
  }
  if (!(await getVendor(input.vendorSlug))) {
    return { ok: false, error: "Vendor does not exist." };
  }
  return { ok: true };
}

async function handleApi(request, response, url) {
  await databaseReady;

  if (request.method === "GET" && url.pathname === "/api/health") {
    return sendJson(response, 200, {
      ok: true,
      project: "TECHNOseller Portal",
      generatedAt: new Date().toISOString()
    });
  }

  if (request.method === "GET" && url.pathname === "/api/taxonomy") {
    return sendJson(response, 200, {
      taxonomy,
      summary: await getMarketplaceSummary()
    });
  }

  if (request.method === "GET" && url.pathname === "/api/artifacts") {
    const vendorSlug = String(url.searchParams.get("vendorSlug") || "").trim();
    const filtered = vendorSlug
      ? artifacts.filter((artifact) => artifact.vendorSlug === vendorSlug)
      : artifacts;
    return sendJson(response, 200, {
      artifacts: [...filtered].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    });
  }

  if (request.method === "GET" && url.pathname === "/api/auth/session") {
    const user = await getRequestUser(request);
    return sendJson(response, 200, {
      authenticated: Boolean(user),
      user: user || null
    });
  }

  if (request.method === "POST" && url.pathname === "/api/auth/login") {
    const retryAfter = checkRateLimit(request, "auth-login", 20);
    if (retryAfter) {
      return sendJson(
        response,
        429,
        { error: "Too many login attempts. Please retry later." },
        { "retry-after": String(retryAfter) }
      );
    }
    const body = await readBody(request);
    if (!body) {
      return sendJson(response, 400, { error: "Invalid JSON body." });
    }
    const username = String(body.username || "").trim();
    const usernameError = validateUsername(username);
    if (usernameError) {
      return sendJson(response, 422, { error: usernameError });
    }

    const { sessionId, user } = await createLoginSession(username);
    return sendJson(
      response,
      200,
      { authenticated: true, user },
      { "set-cookie": sessionCookie(sessionId) }
    );
  }

  if (request.method === "POST" && url.pathname === "/api/auth/logout") {
    const cookies = parseCookies(request.headers.cookie || "");
    if (cookies.technoseller_session) {
      await deleteSession(cookies.technoseller_session);
    }
    return sendJson(
      response,
      200,
      { authenticated: false, user: null },
      { "set-cookie": expiredSessionCookie() }
    );
  }

  if (request.method === "GET" && url.pathname === "/api/vendors") {
    return sendJson(response, 200, {
      vendors: await listVendors(Object.fromEntries(url.searchParams)),
      summary: await getMarketplaceSummary()
    });
  }

  const vendorMatch = url.pathname.match(/^\/api\/vendors\/([a-z0-9-]+)$/);
  if (request.method === "GET" && vendorMatch) {
    const vendor = await getVendor(vendorMatch[1]);
    return vendor ? sendJson(response, 200, { vendor }) : notFound(response);
  }

  if (request.method === "POST" && url.pathname === "/api/leads") {
    const retryAfter = checkRateLimit(request, "lead-submit", 12);
    if (retryAfter) {
      return sendJson(
        response,
        429,
        { error: "Too many lead submissions. Please retry later." },
        { "retry-after": String(retryAfter) }
      );
    }
    const body = await readBody(request);
    if (!body) {
      return sendJson(response, 400, { error: "Invalid JSON body." });
    }
    const validation = await validateLead(body);
    if (!validation.ok) {
      return sendJson(response, 422, { error: validation.error });
    }

    const lead = await createLead(body);
    return sendJson(response, 201, { lead });
  }

  if (request.method === "GET" && url.pathname === "/api/admin/leads") {
    if (!(await requireAdmin(request, response))) return;
    return sendJson(response, 200, { leads: await listLeads() });
  }

  const leadMatch = url.pathname.match(/^\/api\/admin\/leads\/([a-z0-9-]+)$/);
  if (request.method === "PATCH" && leadMatch) {
    if (!(await requireAdmin(request, response))) return;
    const body = await readBody(request);
    const allowedStatuses = ["needs-review", "qualified", "archived"];
    if (!allowedStatuses.includes(body?.status)) {
      return sendJson(response, 422, { error: "Unsupported lead status." });
    }
    const lead = await updateLeadStatus(leadMatch[1], body.status);
    if (!lead) return notFound(response);
    return sendJson(response, 200, { lead });
  }

  return notFound(response);
}

async function serveStatic(response, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const root = resolve(publicDir);
  const resolvedPath = resolve(root, `.${requestedPath}`);
  const relativePath = relative(root, resolvedPath);

  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    response.writeHead(403, securityHeaders);
    return response.end("Forbidden");
  }

  try {
    const file = await readFile(resolvedPath);
    const contentType = mimeTypes[extname(resolvedPath)] || "application/octet-stream";
    response.writeHead(200, {
      ...securityHeaders,
      "content-type": contentType,
      "cache-control": "public, max-age=60"
    });
    response.end(file);
  } catch {
    const appShell = await readFile(join(publicDir, "index.html"));
    response.writeHead(200, {
      ...securityHeaders,
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store"
    });
    response.end(appShell);
  }
}

export function createAppServer() {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", `http://${request.headers.host}`);
      if (url.pathname.startsWith("/api/")) {
        await handleApi(request, response, url);
        return;
      }
      await serveStatic(response, url.pathname);
    } catch (error) {
      const statusCode = Number(error?.statusCode || 500);
      sendJson(response, statusCode, {
        error: statusCode === 500 ? "Internal server error" : error.message
      });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createAppServer().listen(port, () => {
    console.log(`TECHNOseller Portal running at http://127.0.0.1:${port}`);
  });
}
