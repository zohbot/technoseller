export const taxonomy = {
  regions: [
    "North America",
    "Latin America",
    "Europe",
    "Middle East",
    "Africa",
    "South Asia",
    "East Asia",
    "Oceania"
  ],
  services: [
    "Procurement",
    "Manufacturing",
    "Logistics",
    "Compliance",
    "Wholesale",
    "Software",
    "Sourcing",
    "Export Support"
  ],
  verificationStatuses: ["verified", "review", "partner"]
};

export const vendors = [
  {
    id: "vnd-1001",
    slug: "atlas-freight-network",
    name: "Atlas Freight Network",
    tagline: "Regional freight coordination for growing importers.",
    summary:
      "Coordinates freight lanes, customs paperwork, and partner handoffs for mid-market trade teams moving goods across North America and Europe.",
    regions: ["North America", "Europe"],
    services: ["Logistics", "Export Support", "Compliance"],
    verificationStatus: "verified",
    rating: 4.8,
    responseTime: "4 hours",
    headquarters: "Toronto, Canada",
    founded: 2016,
    teamSize: "51-200",
    leadScore: 94,
    opportunities: ["Cold chain expansion", "Cross-border retail replenishment"],
    capabilities: [
      "Brokerage coordination",
      "Shipment exception tracking",
      "Carrier performance reporting"
    ],
    profile:
      "Atlas Freight Network is positioned for buyers who need accountable logistics coordination without building a large internal operations team."
  },
  {
    id: "vnd-1002",
    slug: "meridian-sourceworks",
    name: "Meridian Sourceworks",
    tagline: "Supplier discovery and quality programs for hardware brands.",
    summary:
      "Builds vetted supplier shortlists, manages sampling workflows, and prepares quality documentation for consumer hardware and industrial components.",
    regions: ["East Asia", "North America"],
    services: ["Sourcing", "Manufacturing", "Procurement"],
    verificationStatus: "partner",
    rating: 4.6,
    responseTime: "1 day",
    headquarters: "Singapore",
    founded: 2019,
    teamSize: "11-50",
    leadScore: 88,
    opportunities: ["Component sourcing", "Factory qualification"],
    capabilities: [
      "Supplier scorecards",
      "Prototype sampling",
      "Quality readiness reviews"
    ],
    profile:
      "Meridian Sourceworks helps product teams move from informal supplier searches to repeatable sourcing operations."
  },
  {
    id: "vnd-1003",
    slug: "civitas-compliance-group",
    name: "Civitas Compliance Group",
    tagline: "Trade compliance operations for regulated categories.",
    summary:
      "Supports import documentation, vendor attestations, risk reviews, and audit preparation for healthcare, electronics, and specialty goods.",
    regions: ["Europe", "Middle East", "North America"],
    services: ["Compliance", "Export Support"],
    verificationStatus: "verified",
    rating: 4.9,
    responseTime: "6 hours",
    headquarters: "Amsterdam, Netherlands",
    founded: 2014,
    teamSize: "51-200",
    leadScore: 97,
    opportunities: ["Documentation cleanup", "Regulated market entry"],
    capabilities: [
      "Compliance file review",
      "Vendor documentation workflows",
      "Audit trail preparation"
    ],
    profile:
      "Civitas Compliance Group is designed for buyers who need defensible process, clear documentation, and operational discipline."
  },
  {
    id: "vnd-1004",
    slug: "summit-industrial-exchange",
    name: "Summit Industrial Exchange",
    tagline: "Wholesale supply programs for industrial buyers.",
    summary:
      "Matches buyers with industrial stock, recurring wholesale programs, and regional distributors across durable goods categories.",
    regions: ["North America", "Latin America"],
    services: ["Wholesale", "Procurement", "Sourcing"],
    verificationStatus: "review",
    rating: 4.4,
    responseTime: "2 days",
    headquarters: "Chicago, United States",
    founded: 2021,
    teamSize: "11-50",
    leadScore: 76,
    opportunities: ["Distributor onboarding", "Maintenance supply programs"],
    capabilities: [
      "Catalog normalization",
      "Recurring order planning",
      "Distributor comparisons"
    ],
    profile:
      "Summit Industrial Exchange turns scattered purchasing requests into structured wholesale discovery and vendor comparison workflows."
  },
  {
    id: "vnd-1005",
    slug: "keystone-market-systems",
    name: "Keystone Market Systems",
    tagline: "Workflow software for directory operators and trade teams.",
    summary:
      "Provides CRM, intake, and matching workflows for teams managing vendor marketplaces, regional partner programs, and lead routing.",
    regions: ["North America", "Oceania", "Europe"],
    services: ["Software", "Procurement"],
    verificationStatus: "partner",
    rating: 4.7,
    responseTime: "8 hours",
    headquarters: "Austin, United States",
    founded: 2018,
    teamSize: "11-50",
    leadScore: 91,
    opportunities: ["Marketplace workflow upgrade", "Lead routing automation"],
    capabilities: [
      "Vendor CRM",
      "Lead triage automations",
      "Marketplace analytics"
    ],
    profile:
      "Keystone Market Systems gives operators the tooling layer behind a serious vendor marketplace."
  },
  {
    id: "vnd-1006",
    slug: "nile-trade-advisory",
    name: "Nile Trade Advisory",
    tagline: "Regional market entry support for B2B services.",
    summary:
      "Advises companies entering African and Middle Eastern markets with partner research, local service mapping, and commercial readiness checks.",
    regions: ["Africa", "Middle East", "Europe"],
    services: ["Export Support", "Sourcing", "Compliance"],
    verificationStatus: "verified",
    rating: 4.8,
    responseTime: "1 day",
    headquarters: "Cairo, Egypt",
    founded: 2015,
    teamSize: "11-50",
    leadScore: 90,
    opportunities: ["Market entry research", "Regional partner mapping"],
    capabilities: [
      "Local partner discovery",
      "Commercial due diligence",
      "Regional service maps"
    ],
    profile:
      "Nile Trade Advisory makes regional expansion more concrete by grounding it in qualified partners and practical market context."
  },
  {
    id: "vnd-1007",
    slug: "bluegate-cold-chain",
    name: "Bluegate Cold Chain",
    tagline: "Temperature-controlled logistics programs for regulated shipments.",
    summary:
      "Coordinates validated carriers, lane readiness, exception escalation, and handoff reporting for healthcare, food, and specialty import programs.",
    regions: ["Middle East", "South Asia", "Europe"],
    services: ["Logistics", "Compliance", "Export Support"],
    verificationStatus: "verified",
    rating: 4.8,
    responseTime: "6 hours",
    headquarters: "Dubai, United Arab Emirates",
    founded: 2017,
    teamSize: "51-200",
    leadScore: 93,
    opportunities: ["Cold chain readiness", "Healthcare import programs"],
    capabilities: [
      "Temperature lane qualification",
      "Carrier exception escalation",
      "Validated handoff reporting"
    ],
    profile:
      "Bluegate Cold Chain is built for buyers who need dependable temperature-controlled logistics with documented controls and regional handoff discipline."
  },
  {
    id: "vnd-1008",
    slug: "aurora-materials-desk",
    name: "Aurora Materials Desk",
    tagline: "Specialty materials sourcing for product and industrial teams.",
    summary:
      "Builds supplier options, sample workflows, and quality readiness packs for teams buying specialty materials across manufacturing programs.",
    regions: ["North America", "East Asia", "Oceania"],
    services: ["Sourcing", "Manufacturing", "Procurement"],
    verificationStatus: "partner",
    rating: 4.6,
    responseTime: "1 day",
    headquarters: "Melbourne, Australia",
    founded: 2020,
    teamSize: "11-50",
    leadScore: 86,
    opportunities: ["Material qualification", "Prototype supplier search"],
    capabilities: [
      "Material supplier mapping",
      "Sampling milestone planning",
      "Quality documentation packs"
    ],
    profile:
      "Aurora Materials Desk helps product teams compare materials suppliers with enough structure to move from exploration into qualified sourcing."
  },
  {
    id: "vnd-1009",
    slug: "pacific-wholesale-exchange",
    name: "Pacific Wholesale Exchange",
    tagline: "Wholesale vendor programs for multi-region buyers.",
    summary:
      "Connects buyers to distributors, recurring order programs, and category-specific wholesale supply across durable goods and business consumables.",
    regions: ["Oceania", "East Asia", "North America"],
    services: ["Wholesale", "Logistics", "Procurement"],
    verificationStatus: "review",
    rating: 4.3,
    responseTime: "2 days",
    headquarters: "Auckland, New Zealand",
    founded: 2022,
    teamSize: "2-10",
    leadScore: 82,
    opportunities: ["Recurring wholesale supply", "Distributor comparison"],
    capabilities: [
      "Wholesale catalog mapping",
      "Distributor availability checks",
      "Recurring order coordination"
    ],
    profile:
      "Pacific Wholesale Exchange gives operators a structured path for comparing wholesale vendor options without relying on scattered introductions."
  },
  {
    id: "vnd-1010",
    slug: "northstar-govtrade-systems",
    name: "Northstar GovTrade Systems",
    tagline: "Compliance software and documentation workflows for public-sector trade.",
    summary:
      "Combines workflow software, vendor file governance, and export support for teams selling into regulated public-sector and infrastructure channels.",
    regions: ["North America", "Europe", "Middle East"],
    services: ["Software", "Compliance", "Export Support"],
    verificationStatus: "verified",
    rating: 4.9,
    responseTime: "8 hours",
    headquarters: "Washington, United States",
    founded: 2013,
    teamSize: "51-200",
    leadScore: 95,
    opportunities: ["Public-sector vendor readiness", "Documentation workflow rebuild"],
    capabilities: [
      "Vendor file governance",
      "Controlled documentation workflows",
      "Regulated opportunity intake"
    ],
    profile:
      "Northstar GovTrade Systems is positioned for marketplace operators and suppliers that need stronger controls around regulated buyer opportunities."
  }
];

export const seedLeads = [
  {
    id: "lead-2401",
    vendorSlug: "civitas-compliance-group",
    company: "Northline Devices",
    name: "Avery Chen",
    email: "avery@example.com",
    need: "Prepare compliance documents for a new electronics import program.",
    timeline: "30 days",
    status: "needs-review",
    createdAt: "2026-05-10T14:20:00.000Z"
  },
  {
    id: "lead-2402",
    vendorSlug: "keystone-market-systems",
    company: "Harbor Desk",
    name: "Morgan Lee",
    email: "morgan@example.com",
    need: "Replace spreadsheet-based vendor intake with a searchable portal.",
    timeline: "This quarter",
    status: "qualified",
    createdAt: "2026-05-12T10:45:00.000Z"
  },
  {
    id: "lead-2403",
    vendorSlug: "bluegate-cold-chain",
    company: "Medica Route",
    name: "Samira Patel",
    email: "samira@example.com",
    need: "Qualify cold chain partners for a regional healthcare launch.",
    timeline: "60 days",
    status: "needs-review",
    createdAt: "2026-05-13T16:05:00.000Z"
  },
  {
    id: "lead-2404",
    vendorSlug: "northstar-govtrade-systems",
    company: "Civic Supply Works",
    name: "Daniel Ross",
    email: "daniel@example.com",
    need: "Create a controlled documentation process for public-sector vendor onboarding.",
    timeline: "This quarter",
    status: "qualified",
    createdAt: "2026-05-14T09:30:00.000Z"
  }
];
