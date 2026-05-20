import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { seedLeads, vendors as seedVendors } from "../data/marketplace.mjs";
import { filterVendorList, summarizeVendorList } from "./search.mjs";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const prisma = new PrismaClient();

const allowedLeadStatuses = new Set(["needs-review", "qualified", "archived"]);

function titleizeUsername(username) {
  return username
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function serializeVendor(vendor) {
  return {
    id: vendor.id,
    slug: vendor.slug,
    name: vendor.name,
    tagline: vendor.tagline,
    summary: vendor.summary,
    regionsJson: JSON.stringify(vendor.regions),
    servicesJson: JSON.stringify(vendor.services),
    verificationStatus: vendor.verificationStatus,
    rating: vendor.rating,
    responseTime: vendor.responseTime,
    headquarters: vendor.headquarters,
    founded: vendor.founded,
    teamSize: vendor.teamSize,
    leadScore: vendor.leadScore,
    opportunitiesJson: JSON.stringify(vendor.opportunities),
    capabilitiesJson: JSON.stringify(vendor.capabilities),
    profile: vendor.profile
  };
}

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function deserializeVendor(record) {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    tagline: record.tagline,
    summary: record.summary,
    regions: parseJsonArray(record.regionsJson),
    services: parseJsonArray(record.servicesJson),
    verificationStatus: record.verificationStatus,
    rating: record.rating,
    responseTime: record.responseTime,
    headquarters: record.headquarters,
    founded: record.founded,
    teamSize: record.teamSize,
    leadScore: record.leadScore,
    opportunities: parseJsonArray(record.opportunitiesJson),
    capabilities: parseJsonArray(record.capabilitiesJson),
    profile: record.profile
  };
}

function normalizeLead(record) {
  return {
    id: record.id,
    vendorSlug: record.vendorSlug,
    company: record.company,
    name: record.name,
    email: record.email,
    need: record.need,
    timeline: record.timeline,
    status: record.status,
    createdAt: record.createdAt.toISOString()
  };
}

function publicUser(user) {
  return {
    username: user.username,
    displayName: user.displayName,
    role: user.role
  };
}

function trimField(input, key) {
  return String(input?.[key] || "").trim();
}

export async function seedDatabase() {
  await Promise.all(
    seedVendors.map((vendor) =>
      prisma.vendor.upsert({
        where: { slug: vendor.slug },
        create: serializeVendor(vendor),
        update: serializeVendor(vendor)
      })
    )
  );

  await Promise.all(
    seedLeads.map((lead) =>
      prisma.lead.upsert({
        where: { id: lead.id },
        create: {
          ...lead,
          createdAt: new Date(lead.createdAt)
        },
        update: {}
      })
    )
  );

  const [vendorCount, leadCount] = await Promise.all([
    prisma.vendor.count(),
    prisma.lead.count()
  ]);

  return { vendorCount, leadCount };
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export async function listVendors(params = {}) {
  const records = await prisma.vendor.findMany();
  return filterVendorList(records.map(deserializeVendor), params);
}

export async function getVendor(slug) {
  const record = await prisma.vendor.findUnique({ where: { slug } });
  return record ? deserializeVendor(record) : null;
}

export async function getMarketplaceSummary() {
  const records = await prisma.vendor.findMany();
  return summarizeVendorList(records.map(deserializeVendor));
}

export async function listLeads() {
  const records = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" }
  });
  return records.map(normalizeLead);
}

export async function createLead(input) {
  const email = trimField(input, "email").toLowerCase();
  const lead = await prisma.lead.create({
    data: {
      id: `lead-${randomUUID()}`,
      vendorSlug: trimField(input, "vendorSlug"),
      company: trimField(input, "company"),
      name: trimField(input, "name"),
      email,
      need: trimField(input, "need"),
      timeline: trimField(input, "timeline"),
      status: "needs-review"
    }
  });

  return normalizeLead(lead);
}

export async function updateLeadStatus(id, status) {
  if (!allowedLeadStatuses.has(status)) return null;

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: { status }
    });
    return normalizeLead(lead);
  } catch (error) {
    if (error?.code === "P2025") return null;
    throw error;
  }
}

export async function createLoginSession(username) {
  const normalizedUsername = String(username).trim().replace(/\s+/g, " ");
  const role = normalizedUsername.toLowerCase() === "admin" ? "admin" : "operator";
  const displayName = titleizeUsername(normalizedUsername);
  const user = await prisma.user.upsert({
    where: { username: normalizedUsername },
    create: {
      username: normalizedUsername,
      displayName,
      role
    },
    update: {
      displayName,
      role
    }
  });
  const session = await prisma.session.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
    }
  });

  return { sessionId: session.id, user: publicUser(user) };
}

export async function getSessionUser(sessionId) {
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true }
  });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return publicUser(session.user);
}

export async function deleteSession(sessionId) {
  if (!sessionId) return;
  try {
    await prisma.session.delete({ where: { id: sessionId } });
  } catch (error) {
    if (error?.code !== "P2025") throw error;
  }
}
