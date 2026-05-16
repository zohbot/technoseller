import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { seedLeads, taxonomy } from "./src/data/marketplace.mjs";
import {
  filterVendors,
  findVendor,
  summarizeMarketplace
} from "./src/lib/search.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const distDir = resolve(__dirname, "dist");
const publicDir = existsSync(distDir) ? distDir : resolve(__dirname, "public");
const port = Number(process.env.PORT || 4173);
const leads = [...seedLeads];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg"
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload, null, 2));
}

function notFound(response) {
  sendJson(response, 404, { error: "Not found" });
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}

function validateLead(input) {
  const required = ["vendorSlug", "company", "name", "email", "need", "timeline"];
  const missing = required.filter((key) => !String(input?.[key] || "").trim());
  const emailLooksValid = /\S+@\S+\.\S+/.test(String(input?.email || ""));

  if (missing.length) {
    return { ok: false, error: `Missing fields: ${missing.join(", ")}` };
  }
  if (!emailLooksValid) {
    return { ok: false, error: "A valid email address is required." };
  }
  if (!findVendor(input.vendorSlug)) {
    return { ok: false, error: "Vendor does not exist." };
  }
  return { ok: true };
}

async function handleApi(request, response, url) {
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
      summary: summarizeMarketplace()
    });
  }

  if (request.method === "GET" && url.pathname === "/api/vendors") {
    return sendJson(response, 200, {
      vendors: filterVendors(Object.fromEntries(url.searchParams)),
      summary: summarizeMarketplace()
    });
  }

  const vendorMatch = url.pathname.match(/^\/api\/vendors\/([a-z0-9-]+)$/);
  if (request.method === "GET" && vendorMatch) {
    const vendor = findVendor(vendorMatch[1]);
    return vendor ? sendJson(response, 200, { vendor }) : notFound(response);
  }

  if (request.method === "POST" && url.pathname === "/api/leads") {
    const body = await readBody(request);
    if (!body) {
      return sendJson(response, 400, { error: "Invalid JSON body." });
    }
    const validation = validateLead(body);
    if (!validation.ok) {
      return sendJson(response, 422, { error: validation.error });
    }

    const lead = {
      id: `lead-${Date.now()}`,
      vendorSlug: body.vendorSlug,
      company: String(body.company).trim(),
      name: String(body.name).trim(),
      email: String(body.email).trim(),
      need: String(body.need).trim(),
      timeline: String(body.timeline).trim(),
      status: "needs-review",
      createdAt: new Date().toISOString()
    };
    leads.unshift(lead);
    return sendJson(response, 201, { lead });
  }

  if (request.method === "GET" && url.pathname === "/api/admin/leads") {
    return sendJson(response, 200, { leads });
  }

  const leadMatch = url.pathname.match(/^\/api\/admin\/leads\/([a-z0-9-]+)$/);
  if (request.method === "PATCH" && leadMatch) {
    const body = await readBody(request);
    const lead = leads.find((item) => item.id === leadMatch[1]);
    const allowedStatuses = ["needs-review", "qualified", "archived"];
    if (!lead) return notFound(response);
    if (!allowedStatuses.includes(body?.status)) {
      return sendJson(response, 422, { error: "Unsupported lead status." });
    }
    lead.status = body.status;
    return sendJson(response, 200, { lead });
  }

  return notFound(response);
}

async function serveStatic(response, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = normalize(join(publicDir, requestedPath));
  const resolvedPath = resolve(filePath);

  if (!resolvedPath.startsWith(publicDir)) {
    response.writeHead(403);
    return response.end("Forbidden");
  }

  try {
    const file = await readFile(resolvedPath);
    const contentType = mimeTypes[extname(resolvedPath)] || "application/octet-stream";
    response.writeHead(200, {
      "content-type": contentType,
      "cache-control": "public, max-age=60"
    });
    response.end(file);
  } catch {
    const appShell = await readFile(join(publicDir, "index.html"));
    response.writeHead(200, {
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
      sendJson(response, 500, {
        error: "Internal server error",
        detail: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createAppServer().listen(port, () => {
    console.log(`TECHNOseller Portal running at http://127.0.0.1:${port}`);
  });
}
