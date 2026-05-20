import { vendors } from "../data/marketplace.mjs";

export function normalize(value = "") {
  return String(value).trim().toLowerCase();
}

export function filterVendorList(items, params = {}) {
  const query = normalize(params.query);
  const region = normalize(params.region);
  const service = normalize(params.service);
  const status = normalize(params.status);
  const minScore = Number(params.minScore || 0);
  const response = normalize(params.response);
  const sort = normalize(params.sort || "fit");

  const filtered = items
    .filter((vendor) => {
      const searchable = [
        vendor.name,
        vendor.tagline,
        vendor.summary,
        vendor.headquarters,
        ...vendor.regions,
        ...vendor.services,
        ...vendor.capabilities,
        ...vendor.opportunities
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query || searchable.includes(query);
      const matchesRegion =
        !region || vendor.regions.some((item) => normalize(item) === region);
      const matchesService =
        !service || vendor.services.some((item) => normalize(item) === service);
      const matchesStatus =
        !status || normalize(vendor.verificationStatus) === status;
      const matchesScore = !minScore || vendor.leadScore >= minScore;
      const responseTime = normalize(vendor.responseTime);
      const matchesResponse =
        !response ||
        (response === "hours" && responseTime.includes("hours")) ||
        (response === "1-day" && responseTime === "1 day") ||
        (response === "2-days" && responseTime === "2 days");

      return (
        matchesQuery &&
        matchesRegion &&
        matchesService &&
        matchesStatus &&
        matchesScore &&
        matchesResponse
      );
    });

  return sortVendors(filtered, sort);
}

export function filterVendors(params = {}) {
  return filterVendorList(vendors, params);
}

function responseRank(vendor) {
  const time = normalize(vendor.responseTime);
  if (time.includes("4 hours")) return 1;
  if (time.includes("6 hours")) return 2;
  if (time.includes("8 hours")) return 3;
  if (time.includes("1 day")) return 4;
  if (time.includes("2 days")) return 5;
  return 10;
}

function sortVendors(items, sort) {
  return [...items].sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating || b.leadScore - a.leadScore;
    if (sort === "response") return responseRank(a) - responseRank(b);
    return b.leadScore - a.leadScore;
  });
}

export function findVendor(slug) {
  return vendors.find((vendor) => vendor.slug === slug);
}

export function summarizeVendorList(items) {
  const regionCount = new Set(items.flatMap((vendor) => vendor.regions)).size;
  const serviceCount = new Set(items.flatMap((vendor) => vendor.services)).size;
  const verifiedCount = items.filter(
    (vendor) => vendor.verificationStatus === "verified"
  ).length;

  return {
    vendorCount: items.length,
    regionCount,
    serviceCount,
    verifiedCount
  };
}

export function summarizeMarketplace() {
  return summarizeVendorList(vendors);
}
