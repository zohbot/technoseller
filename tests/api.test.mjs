import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { createAppServer } from "../server.mjs";
import { filterVendors, findVendor, summarizeMarketplace } from "../src/lib/search.mjs";

let server;
let baseUrl;

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

  const queueResponse = await fetch(`${baseUrl}/api/admin/leads`);
  const queuePayload = await queueResponse.json();
  assert.equal(queuePayload.leads[0].company, "Demo Buyer");
});
