import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { createAppServer } from "../server.mjs";
import { filterVendors, findVendor, summarizeMarketplace } from "../src/lib/search.mjs";

let server;
let baseUrl;

async function login(username = "admin") {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username })
  });
  return response.headers.get("set-cookie");
}

before(async () => {
  server = createAppServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("summarizes marketplace data", () => {
  const summary = summarizeMarketplace();
  assert.equal(summary.vendorCount, 10);
  assert.equal(summary.verifiedCount, 5);
  assert.ok(summary.regionCount >= 6);
});

test("filters vendors by service and region", () => {
  const results = filterVendors({
    service: "Compliance",
    region: "Europe"
  });
  assert.ok(results.length >= 2);
  assert.ok(results.every((vendor) => vendor.services.includes("Compliance")));
  assert.ok(results.every((vendor) => vendor.regions.includes("Europe")));
});

test("filters saved-view style queries and response sorting", () => {
  const highFit = filterVendors({ minScore: "90" });
  assert.ok(highFit.length >= 3);
  assert.ok(highFit.every((vendor) => vendor.leadScore >= 90));

  const fastest = filterVendors({ sort: "response" });
  assert.equal(fastest[0].responseTime, "4 hours");
});

test("finds vendor by slug", () => {
  const vendor = findVendor("atlas-freight-network");
  assert.equal(vendor.name, "Atlas Freight Network");
});

test("serves vendor API results", async () => {
  const response = await fetch(`${baseUrl}/api/vendors?query=freight`);
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.vendors[0].slug, "atlas-freight-network");
});

test("serves demo artifact metadata", async () => {
  const response = await fetch(`${baseUrl}/api/artifacts?vendorSlug=atlas-freight-network`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.artifacts.length, 1);
  assert.equal(payload.artifacts[0].type, "Verification packet");
  assert.match(payload.artifacts[0].href, /demo-artifacts/);
});

test("sets baseline security headers", async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("content-security-policy"), /default-src 'self'/);
});

test("validates and stores a lead", async () => {
  const response = await fetch(`${baseUrl}/api/leads`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      vendorSlug: "atlas-freight-network",
      company: "Demo Buyer",
      name: "Taylor Morgan",
      email: "taylor@example.com",
      need: "Need freight support for a launch program.",
      timeline: "45 days"
    })
  });
  const payload = await response.json();
  assert.equal(response.status, 201);
  assert.equal(payload.lead.status, "needs-review");

  const adminCookie = await login("admin");
  const queueResponse = await fetch(`${baseUrl}/api/admin/leads`);
  assert.equal(queueResponse.status, 401);

  const adminQueueResponse = await fetch(`${baseUrl}/api/admin/leads`, {
    headers: { cookie: adminCookie }
  });
  const queuePayload = await adminQueueResponse.json();
  assert.equal(adminQueueResponse.status, 200);
  assert.equal(queuePayload.leads[0].company, "Demo Buyer");
});

test("protects lead moderation updates with admin role", async () => {
  const operatorCookie = await login("demo");
  const adminCookie = await login("admin");

  const queueResponse = await fetch(`${baseUrl}/api/admin/leads`, {
    headers: { cookie: adminCookie }
  });
  const queuePayload = await queueResponse.json();
  const lead = queuePayload.leads[0];

  const operatorResponse = await fetch(`${baseUrl}/api/admin/leads/${lead.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", cookie: operatorCookie },
    body: JSON.stringify({ status: "qualified" })
  });
  assert.equal(operatorResponse.status, 403);

  const adminResponse = await fetch(`${baseUrl}/api/admin/leads/${lead.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", cookie: adminCookie },
    body: JSON.stringify({ status: "qualified" })
  });
  const adminPayload = await adminResponse.json();
  assert.equal(adminResponse.status, 200);
  assert.equal(adminPayload.lead.status, "qualified");
});

test("rejects oversized JSON payloads", async () => {
  const response = await fetch(`${baseUrl}/api/leads`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      vendorSlug: "atlas-freight-network",
      company: "Payload Test",
      name: "Taylor Morgan",
      email: "payload@example.com",
      need: "x".repeat(70_000),
      timeline: "45 days"
    })
  });
  const payload = await response.json();
  assert.equal(response.status, 413);
  assert.match(payload.error, /too large/i);
});

test("creates and clears a dummy auth session", async () => {
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "demo" })
  });
  const loginPayload = await loginResponse.json();
  const cookie = loginResponse.headers.get("set-cookie");

  assert.equal(loginResponse.status, 200);
  assert.equal(loginPayload.authenticated, true);
  assert.equal(loginPayload.user.username, "demo");
  assert.match(cookie, /technoseller_session=/);

  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { cookie }
  });
  const sessionPayload = await sessionResponse.json();
  assert.equal(sessionPayload.authenticated, true);
  assert.equal(sessionPayload.user.role, "operator");

  const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { cookie }
  });
  const logoutPayload = await logoutResponse.json();
  assert.equal(logoutPayload.authenticated, false);
  assert.match(logoutResponse.headers.get("set-cookie"), /Max-Age=0/);
});
