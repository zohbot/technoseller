export type VerificationStatus = "verified" | "partner" | "review";
export type LeadStatus = "needs-review" | "qualified" | "archived";

export type Vendor = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  regions: string[];
  services: string[];
  verificationStatus: VerificationStatus;
  rating: number;
  responseTime: string;
  headquarters: string;
  founded: number;
  teamSize: string;
  leadScore: number;
  opportunities: string[];
  capabilities: string[];
  profile: string;
};

export type Lead = {
  id: string;
  vendorSlug: string;
  company: string;
  name: string;
  email: string;
  need: string;
  timeline: string;
  status: LeadStatus;
  createdAt: string;
};

export type Taxonomy = {
  regions: string[];
  services: string[];
  verificationStatuses: VerificationStatus[];
};

export type Summary = {
  vendorCount: number;
  regionCount: number;
  serviceCount: number;
  verifiedCount: number;
};
