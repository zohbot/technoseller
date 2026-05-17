import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Archive,
  ArrowLeft,
  Boxes,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Globe2,
  LayoutDashboard,
  MapPin,
  Network,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  X
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from "react";
import { cn } from "./lib/utils";
import type { Lead, LeadStatus, Summary, Taxonomy, Vendor, VerificationStatus } from "./types";

type Filters = {
  query: string;
  region: string;
  service: string;
  status: string;
  minScore: string;
  response: string;
  sort: string;
};

type ViewKey = "all" | "verified" | "logistics" | "compliance" | "high-fit";
type SelectOption = string | { value: string; label: string };

const defaultFilters: Filters = {
  query: "",
  region: "",
  service: "",
  status: "",
  minScore: "",
  response: "",
  sort: "fit"
};

const viewFilters: Record<ViewKey, Partial<Filters>> = {
  all: {},
  verified: { status: "verified" },
  logistics: { service: "Logistics" },
  compliance: { service: "Compliance" },
  "high-fit": { minScore: "90" }
};

const viewLabels: Record<ViewKey, string> = {
  all: "All",
  verified: "Verified",
  logistics: "Logistics",
  compliance: "Compliance",
  "high-fit": "High fit"
};

const statusLabels: Record<string, string> = {
  verified: "Verified",
  partner: "Partner",
  review: "In review",
  "needs-review": "Needs review",
  qualified: "Qualified",
  archived: "Archived"
};

async function request<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...options
  });
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function Badge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "royal" | "gold" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-black",
        tone === "royal" && "border-[#0d21a1]/15 bg-[#0d21a1]/10 text-[#0d21a1]",
        tone === "gold" && "border-[#eec643]/30 bg-[#eec643]/20 text-[#725900]",
        tone === "danger" && "border-[#141414]/10 bg-[#eef0f2] text-[#4c5564]",
        tone === "neutral" && "border-[#141414]/10 bg-white text-[#56606f]"
      )}
    >
      {children}
    </span>
  );
}

function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-[7px] px-4 text-sm font-black transition focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#eec643]/60",
        variant === "primary" && "bg-[#0d21a1] text-white shadow-[0_14px_30px_rgba(13,33,161,0.22)] hover:bg-[#011638]",
        variant === "secondary" && "border border-[#141414]/10 bg-white text-[#141414] hover:border-[#0d21a1]/30 hover:text-[#0d21a1]",
        variant === "ghost" && "bg-[#eef0f2] text-[#141414] hover:bg-white",
        className
      )}
      {...props}
    />
  );
}

function SelectBox({
  label,
  value,
  placeholder,
  options,
  onChange
}: {
  label: string;
  value: string;
  placeholder: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black uppercase text-[#5f6670]">{label}</span>
      <Select.Root value={value || "__all"} onValueChange={(next) => onChange(next === "__all" ? "" : next)}>
        <Select.Trigger className="flex h-11 w-full items-center justify-between rounded-[7px] border border-[#141414]/12 bg-white px-3 text-left text-sm font-bold text-[#141414] shadow-sm outline-none focus:ring-3 focus:ring-[#0d21a1]/15">
          <Select.Value />
          <Select.Icon>
            <ChevronDown className="size-4 text-[#5f6670]" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="z-50 overflow-hidden rounded-[8px] border border-[#141414]/10 bg-white p-1 shadow-2xl">
            <Select.Viewport>
              <Select.Item
                value="__all"
                className="cursor-pointer rounded-[6px] px-3 py-2 text-sm font-bold outline-none data-[highlighted]:bg-[#eef0f2]"
              >
                <Select.ItemText>{placeholder}</Select.ItemText>
              </Select.Item>
              {options.map((option) => {
                const item = typeof option === "string" ? { value: option, label: option } : option;
                return (
                <Select.Item
                  key={item.value}
                  value={item.value}
                  className="cursor-pointer rounded-[6px] px-3 py-2 text-sm font-bold outline-none data-[highlighted]:bg-[#eef0f2]"
                >
                  <Select.ItemText>{item.label}</Select.ItemText>
                </Select.Item>
                );
              })}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </label>
  );
}

function statusTone(status: string): "royal" | "gold" | "danger" | "neutral" {
  if (status === "verified" || status === "qualified") return "royal";
  if (status === "partner" || status === "review" || status === "needs-review") return "gold";
  if (status === "archived") return "danger";
  return "neutral";
}

function responseLabel(value: string) {
  return {
    hours: "Same day",
    "1-day": "1 day",
    "2-days": "2 days"
  }[value] || value;
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="border-r border-[#141414]/10 bg-white p-5 last:border-r-0">
      <strong className="block text-3xl font-black tracking-normal text-[#141414]">{value}</strong>
      <span className="text-sm text-[#5f6670]">{label}</span>
    </div>
  );
}

function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <article className="grid gap-4 rounded-[8px] border border-[#141414]/10 bg-[#fbfcff] p-5 shadow-[0_18px_44px_rgba(1,22,56,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-11 place-items-center rounded-[8px] bg-[#011638] text-sm font-black text-[#eec643]">
            {initials(vendor.name)}
          </span>
          <Badge tone={statusTone(vendor.verificationStatus)}>{statusLabels[vendor.verificationStatus]}</Badge>
        </div>
        <Badge>{vendor.leadScore} fit score</Badge>
      </div>
      <div>
        <h3 className="text-xl font-black text-[#141414]">{vendor.name}</h3>
        <p className="mt-2 font-black text-[#4f5867]">{vendor.tagline}</p>
        <p className="mt-3 text-sm leading-6 text-[#5f6670]">{vendor.summary}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-[#eec643]" />
        <span className="h-px flex-1 bg-[#0d21a1]/20" />
        <span className="size-2 rounded-full bg-[#eec643]" />
        <span className="size-2 rounded-full bg-[#eec643]/60" />
      </div>
      <div className="flex flex-wrap gap-2">
        {vendor.services.map((service) => (
          <Badge key={service}>{service}</Badge>
        ))}
      </div>
      <dl className="grid gap-3 text-sm">
        <div>
          <dt className="text-xs font-black uppercase text-[#5f6670]">Regions</dt>
          <dd className="mt-1 text-[#141414]">{vendor.regions.join(", ")}</dd>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs font-black uppercase text-[#5f6670]">Response</dt>
            <dd className="mt-1 text-[#141414]">{vendor.responseTime}</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase text-[#5f6670]">Rating</dt>
            <dd className="mt-1 text-[#141414]">{vendor.rating.toFixed(1)}</dd>
          </div>
        </div>
      </dl>
      <Button className="w-full" onClick={() => navigate(`/vendors/${vendor.slug}`)}>
        View profile
      </Button>
    </article>
  );
}

function DirectorySearch({
  taxonomy,
  filters,
  activeView,
  vendorCount,
  onFilters,
  onView
}: {
  taxonomy: Taxonomy | null;
  filters: Filters;
  activeView: ViewKey;
  vendorCount: number;
  onFilters: (filters: Filters) => void;
  onView: (view: ViewKey) => void;
}) {
  const activeFilters = [
    filters.query && ["query", `Search: ${filters.query}`],
    filters.region && ["region", `Region: ${filters.region}`],
    filters.service && ["service", `Service: ${filters.service}`],
    filters.status && ["status", `Status: ${statusLabels[filters.status]}`],
    filters.minScore && ["minScore", `Fit: ${filters.minScore}+`],
    filters.response && ["response", `Response: ${responseLabel(filters.response)}`]
  ].filter(Boolean) as [keyof Filters, string][];

  function patch(next: Partial<Filters>) {
    onFilters({ ...filters, ...next });
  }

  function clearFilter(key: keyof Filters) {
    patch({ [key]: "" } as Partial<Filters>);
  }

  return (
    <section className="rounded-[8px] border border-[#141414]/10 bg-white/92 p-5 shadow-[0_24px_70px_rgba(1,22,56,0.12)] backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-[8px] bg-[#011638] text-sm font-black text-[#eec643]">01</span>
        <div>
          <p className="text-xs font-black uppercase text-[#c79f1d]">Directory search</p>
          <h2 className="text-2xl font-black text-[#141414]">Merchant resource finder</h2>
        </div>
        <Badge tone="royal">Live index</Badge>
      </div>

      <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-[8px] border border-[#141414]/10 bg-white p-2 shadow-sm max-sm:grid-cols-[auto_minmax(0,1fr)]">
        <span className="grid size-10 place-items-center rounded-[7px] bg-[#eef0f2] text-[#0d21a1]">
          <Search className="size-5" />
        </span>
        <input
          value={filters.query}
          onChange={(event) => patch({ query: event.target.value })}
          className="h-10 min-w-0 bg-transparent text-sm font-black text-[#141414] outline-none placeholder:text-[#6a7280]"
          placeholder="Search compliance, freight, sourcing, regions..."
        />
        <Button className="max-sm:col-span-2 max-sm:w-full" onClick={() => onFilters({ ...filters })}>
          Search
        </Button>
      </div>

      <Tabs.Root value={activeView} onValueChange={(value) => onView(value as ViewKey)} className="mt-4">
        <Tabs.List className="flex flex-wrap gap-1 rounded-[8px] border border-[#141414]/10 bg-[#eef0f2] p-1">
          {(Object.keys(viewLabels) as ViewKey[]).map((view) => (
            <Tabs.Trigger
              key={view}
              value={view}
              className="h-9 rounded-[7px] px-3 text-sm font-black text-[#596272] data-[state=active]:bg-white data-[state=active]:text-[#0d21a1] data-[state=active]:shadow-sm"
            >
              {viewLabels[view]}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>

      <div className="mt-4 grid grid-cols-3 gap-3 max-lg:grid-cols-1">
        <SelectBox
          label="Region"
          value={filters.region}
          placeholder="All regions"
          options={taxonomy?.regions || []}
          onChange={(region) => patch({ region })}
        />
        <SelectBox
          label="Service"
          value={filters.service}
          placeholder="All services"
          options={taxonomy?.services || []}
          onChange={(service) => patch({ service })}
        />
        <SelectBox
          label="Status"
          value={filters.status}
          placeholder="Any status"
          options={[
            { value: "verified", label: "Verified" },
            { value: "partner", label: "Partner" },
            { value: "review", label: "In review" }
          ]}
          onChange={(status) => patch({ status })}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {activeFilters.length ? (
            activeFilters.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => clearFilter(key)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#0d21a1]/15 bg-[#0d21a1]/10 px-3 text-xs font-black text-[#0d21a1]"
              >
                {label}
                <X className="size-3.5" />
              </button>
            ))
          ) : (
            <span className="text-sm font-bold text-[#5f6670]">No active filters</span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-sm font-black text-[#011638]">
            {vendorCount} {vendorCount === 1 ? "vendor" : "vendors"}
          </span>
          <SelectBox
            label="Sort"
            value={filters.sort}
            placeholder="Fit score"
            options={[
              { value: "fit", label: "Fit score" },
              { value: "rating", label: "Rating" },
              { value: "response", label: "Fastest response" }
            ]}
            onChange={(sort) => patch({ sort: sort || "fit" })}
          />
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <Button variant="secondary">
                <SlidersHorizontal className="size-4" />
                Advanced
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-[#011638]/45 backdrop-blur-sm" />
              <Dialog.Content className="fixed right-4 top-4 z-50 grid w-[min(420px,calc(100vw-32px))] gap-4 rounded-[8px] border border-white/15 bg-white p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Dialog.Title className="text-xl font-black text-[#141414]">Advanced filters</Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm text-[#5f6670]">
                      Tighten the operator view by fit score and response speed.
                    </Dialog.Description>
                  </div>
                  <Dialog.Close asChild>
                    <Button variant="ghost" className="size-10 px-0">
                      <X className="size-4" />
                    </Button>
                  </Dialog.Close>
                </div>
                <SelectBox
                  label="Minimum fit"
                  value={filters.minScore}
                  placeholder="Any score"
                  options={[
                    { value: "80", label: "80+" },
                    { value: "90", label: "90+" },
                    { value: "95", label: "95+" }
                  ]}
                  onChange={(minScore) => patch({ minScore })}
                />
                <SelectBox
                  label="Response window"
                  value={filters.response}
                  placeholder="Any response"
                  options={[
                    { value: "hours", label: "Same day" },
                    { value: "1-day", label: "1 day" },
                    { value: "2-days", label: "2 days" }
                  ]}
                  onChange={(response) => patch({ response })}
                />
                <Button
                  variant="secondary"
                  onClick={() => onFilters({ ...defaultFilters })}
                >
                  Clear all filters
                </Button>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </section>
  );
}

function Hero({
  taxonomy,
  filters,
  activeView,
  vendorCount,
  onFilters,
  onView
}: {
  taxonomy: Taxonomy | null;
  filters: Filters;
  activeView: ViewKey;
  vendorCount: number;
  onFilters: (filters: Filters) => void;
  onView: (view: ViewKey) => void;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
      <div className="relative overflow-hidden rounded-[8px] bg-[#011638] p-8 text-white shadow-[0_30px_90px_rgba(1,22,56,0.28)] lg:min-h-[620px] lg:p-12">
        <div className="absolute bottom-[-160px] right-[-120px] size-80 rounded-full border border-[#eec643]/40" />
        <p className="text-xs font-black uppercase text-[#eec643]">Marketplace command center</p>
        <h1 className="mt-6 max-w-xl text-5xl font-black leading-[0.95] tracking-normal md:text-7xl">
          Discover qualified vendors with operator-grade confidence.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-white/78">
          A production-grade marketplace workspace with regional discovery, trust signals,
          lead routing, and moderation built for business buyers.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button className="bg-[#eec643] text-[#141414] hover:bg-white" onClick={() => document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" })}>
            Browse directory
          </Button>
          <Button variant="secondary" className="border-white/20 bg-white/8 text-white hover:bg-white hover:text-[#141414]" onClick={() => document.getElementById("moderation")?.scrollIntoView({ behavior: "smooth" })}>
            View queue
          </Button>
        </div>
        <div className="mt-10 grid grid-cols-3 overflow-hidden rounded-[8px] border border-white/15 bg-white/10 max-sm:grid-cols-1">
          {["Verified supply", "Regional coverage", "Lead moderation"].map((item) => (
            <span key={item} className="border-r border-white/10 p-4 text-sm font-black last:border-r-0 max-sm:border-b max-sm:border-r-0">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-5">
        <figure className="relative min-h-[320px] overflow-hidden rounded-[8px] border border-[#141414]/10 shadow-[0_26px_70px_rgba(1,22,56,0.18)]">
          <img className="size-full object-cover" src="/assets/marketplace-command-center.png" alt="Marketplace operations command center" />
          <figcaption className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4 rounded-[8px] bg-[#011638]/88 p-4 text-white backdrop-blur max-sm:grid max-sm:gap-2">
            <strong className="shrink-0">Live market map</strong>
            <span className="text-sm text-white/75">Vendor lanes, services, regions, and qualification signals.</span>
          </figcaption>
        </figure>
        <DirectorySearch
          taxonomy={taxonomy}
          filters={filters}
          activeView={activeView}
          vendorCount={vendorCount}
          onFilters={onFilters}
          onView={onView}
        />
      </div>
    </section>
  );
}

function InsightPanel() {
  return (
    <aside className="sticky top-5 self-start rounded-[8px] border border-[#141414]/10 bg-white p-5 shadow-[0_18px_54px_rgba(1,22,56,0.08)] max-lg:static">
      <img className="aspect-[1/0.78] w-full rounded-[8px] border border-[#141414]/10 object-cover" src="/assets/technoseller-logo-concept.png" alt="TECHNOseller logo concept" />
      <div className="mt-5">
        <h2 className="text-lg font-black text-[#141414]">Operator focus</h2>
        <p className="mt-2 text-sm leading-6 text-[#5f6670]">
          Square-inspired operational density with trust status, service fit, region coverage, and lead readiness up front.
        </p>
      </div>
      <div className="mt-5 grid gap-3">
        {[
          [ShieldCheck, "Trust review"],
          [RouteIcon, "Service routing"],
          [Briefcase, "Buyer workflow"]
        ].map(([Icon, label]) => {
          const IconComponent = Icon as typeof ShieldCheck;
          return (
            <div key={label as string} className="flex items-center gap-3 rounded-[8px] border border-[#141414]/10 bg-[#eef0f2]/70 p-3">
              <IconComponent className="size-4 text-[#0d21a1]" />
              <span className="text-sm font-black text-[#141414]">{label as string}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function RouteIcon(props: ComponentProps<typeof Network>) {
  return <Network {...props} />;
}

function Directory({ vendors, sort }: { vendors: Vendor[]; sort: string }) {
  const sortLabel = {
    fit: "Sorted by marketplace fit score",
    rating: "Sorted by buyer rating",
    response: "Sorted by fastest response"
  }[sort] || "Sorted by marketplace fit score";

  return (
    <section id="directory" className="rounded-[8px] border border-[#141414]/10 bg-white p-6 shadow-[0_18px_54px_rgba(1,22,56,0.08)]">
      <div className="flex items-end justify-between gap-4 max-sm:block">
        <div>
          <p className="text-xs font-black uppercase text-[#c79f1d]">Directory</p>
          <h2 className="mt-2 text-3xl font-black text-[#141414]">
            {vendors.length} matching {vendors.length === 1 ? "vendor" : "vendors"}
          </h2>
        </div>
        <span className="text-sm text-[#5f6670]">{sortLabel}</span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-5 max-xl:grid-cols-1">
        {vendors.map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} />
        ))}
        {!vendors.length && (
          <div className="col-span-full rounded-[8px] border border-dashed border-[#141414]/20 p-8 text-[#5f6670]">
            No vendors match these filters.
          </div>
        )}
      </div>
    </section>
  );
}

function ServiceTracks() {
  const tracks = [
    {
      title: "Compliance Review",
      eyebrow: "Trust operations",
      image: "/assets/compliance-review.png",
      icon: ShieldCheck,
      copy:
        "Structure supplier documents, attestations, risk notes, and audit readiness into a workflow buyers can understand before they engage.",
      metrics: ["5 verified lanes", "8 document signals", "Same-day triage"]
    },
    {
      title: "Supplier Discovery",
      eyebrow: "Sourcing intelligence",
      image: "/assets/supplier-discovery.png",
      icon: Boxes,
      copy:
        "Compare suppliers by capability, region, materials, readiness, and opportunity fit instead of relying on loose profile browsing.",
      metrics: ["10 vendor profiles", "8 service lines", "8 regions"]
    },
    {
      title: "Lead Routing",
      eyebrow: "Operator queue",
      image: "/assets/lead-routing-console.png",
      icon: LayoutDashboard,
      copy:
        "Route inbound buyer interest into a moderation queue so operators can qualify, archive, and prioritize the opportunities that matter.",
      metrics: ["4 seeded leads", "3 lead states", "Audit-friendly flow"]
    }
  ];

  return (
    <section className="rounded-[8px] border border-[#141414]/10 bg-white p-7">
      <div className="flex items-end justify-between gap-4 max-sm:block">
        <div>
          <p className="text-xs font-black uppercase text-[#c79f1d]">Service tracks</p>
          <h2 className="mt-3 text-3xl font-black text-[#141414]">Marketplace operations with substance.</h2>
        </div>
        <p className="max-w-lg text-sm leading-6 text-[#5f6670]">
          Each track is designed as a real buyer workflow, not a decorative category tile.
        </p>
      </div>
      <div className="mt-7 grid grid-cols-3 gap-5 max-xl:grid-cols-1">
        {tracks.map((track) => {
          const Icon = track.icon;
          return (
            <article key={track.title} className="overflow-hidden rounded-[8px] border border-[#141414]/10 bg-[#fbfcff] shadow-[0_18px_44px_rgba(1,22,56,0.07)]">
              <img className="aspect-[16/10] w-full object-cover" src={track.image} alt={`${track.title} workflow`} />
              <div className="grid gap-4 p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-[8px] bg-[#011638] text-[#eec643]">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase text-[#c79f1d]">{track.eyebrow}</p>
                    <h3 className="text-xl font-black text-[#141414]">{track.title}</h3>
                  </div>
                </div>
                <p className="text-sm leading-6 text-[#5f6670]">{track.copy}</p>
                <div className="grid grid-cols-3 gap-2">
                  {track.metrics.map((metric) => (
                    <span key={metric} className="rounded-[7px] border border-[#141414]/10 bg-white p-2 text-xs font-black text-[#4f5867]">
                      {metric}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function RegionalIntelligence() {
  const regions = [
    ["North America", "Public-sector readiness, wholesale supply, and logistics operations"],
    ["Europe", "Compliance reviews, export support, and regional vendor governance"],
    ["Middle East", "Cold chain programs, market entry, and regulated documentation"],
    ["East Asia", "Supplier discovery, manufacturing readiness, and procurement support"],
    ["Oceania", "Wholesale exchange, sourcing desks, and software workflow partners"],
    ["Africa", "Partner mapping, commercial diligence, and market-entry advisory"]
  ];

  return (
    <section className="grid grid-cols-[1fr_0.9fr] gap-6 rounded-[8px] border border-[#141414]/10 bg-[#011638] p-7 text-white shadow-[0_24px_80px_rgba(1,22,56,0.22)] max-lg:grid-cols-1">
      <figure className="overflow-hidden rounded-[8px] border border-white/15">
        <img className="aspect-[16/10] size-full object-cover" src="/assets/regional-network.png" alt="Global regional marketplace network" />
      </figure>
      <div className="grid content-center gap-5">
        <div>
          <p className="text-xs font-black uppercase text-[#eec643]">Regional intelligence</p>
          <h2 className="mt-3 text-4xl font-black leading-tight">Turn service coverage into a market map.</h2>
          <p className="mt-4 leading-7 text-white/72">
            TECHNOseller groups suppliers, advisors, logistics partners, software teams, and wholesale programs by the regions where buyers need action.
          </p>
        </div>
        <div className="grid gap-2">
          {regions.map(([region, detail]) => (
            <div key={region} className="grid grid-cols-[150px_1fr] gap-3 rounded-[8px] border border-white/12 bg-white/8 p-3 max-sm:grid-cols-1">
              <strong className="text-[#eec643]">{region}</strong>
              <span className="text-sm text-white/75">{detail}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OperatingSystem() {
  return (
    <section className="grid grid-cols-[0.9fr_1.1fr] gap-6 rounded-[8px] border border-[#141414]/10 bg-white p-7 max-lg:grid-cols-1">
      <div className="grid content-center gap-5">
        <p className="text-xs font-black uppercase text-[#c79f1d]">Marketplace operating system</p>
        <h2 className="text-4xl font-black leading-tight text-[#141414]">A fuller product story for buyers, vendors, and moderators.</h2>
        <p className="leading-7 text-[#5f6670]">
          The portal now has enough depth to show a believable SaaS concept: discovery, saved views, regional coverage, category workflows,
          vendor trust signals, inquiry routing, and a moderation queue.
        </p>
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          {[
            [Globe2, "Regional discovery", "See where vendors operate and which lanes are strongest."],
            [Star, "Fit scoring", "Prioritize vendors by score, response time, and verification."],
            [Clock3, "Response windows", "Set buyer expectations before the first inquiry."],
            [MapPin, "Opportunity routing", "Match buyer needs to the right service profile."]
          ].map(([Icon, title, copy]) => {
            const IconComponent = Icon as typeof Globe2;
            return (
              <article key={title as string} className="rounded-[8px] border border-[#141414]/10 bg-[#eef0f2] p-4">
                <IconComponent className="size-5 text-[#0d21a1]" />
                <h3 className="mt-3 font-black text-[#141414]">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5f6670]">{copy as string}</p>
              </article>
            );
          })}
        </div>
      </div>
      <img className="min-h-[420px] w-full rounded-[8px] object-cover shadow-[0_18px_54px_rgba(1,22,56,0.12)]" src="/assets/operations-workspace.png" alt="Marketplace operations workspace" />
    </section>
  );
}

function PlatformDepth() {
  return (
    <section className="rounded-[8px] border border-[#141414]/10 bg-white p-7">
      <div className="flex items-end justify-between gap-4 max-sm:block">
        <div>
          <p className="text-xs font-black uppercase text-[#c79f1d]">Marketplace depth</p>
          <h2 className="mt-3 text-3xl font-black text-[#141414]">More than a directory card wall.</h2>
        </div>
        <span className="text-sm text-[#5f6670]">A production-minded buyer and operator flow.</span>
      </div>
      <div className="mt-7 grid grid-cols-3 gap-4 max-lg:grid-cols-1">
        {[
          ["01", "Trust signals up front", "Verification status, fit score, response windows, and service coverage help buyers scan quickly."],
          ["02", "Regional service matching", "Search combines capability, geography, and category fit instead of vague profile browsing."],
          ["03", "Lead quality control", "Inbound requests flow into moderation before becoming qualified vendor opportunities."]
        ].map(([index, title, copy]) => (
          <article key={index} className="rounded-[8px] border border-[#141414]/10 bg-gradient-to-b from-white to-[#eef0f2] p-5">
            <span className="grid size-10 place-items-center rounded-[8px] bg-[#011638] text-sm font-black text-[#eec643]">{index}</span>
            <h3 className="mt-6 text-lg font-black text-[#141414]">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#5f6670]">{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function LeadFlow() {
  return (
    <section id="lead-flow" className="grid grid-cols-[0.7fr_1fr] items-center gap-8 rounded-[8px] border border-[#141414]/10 bg-white p-7 max-lg:grid-cols-1">
      <div>
        <p className="text-xs font-black uppercase text-[#c79f1d]">Lead operations</p>
        <h2 className="mt-3 text-4xl font-black leading-tight text-[#141414]">Contact flow with moderation built in.</h2>
      </div>
      <figure className="grid grid-cols-[0.9fr_1fr] items-center gap-6 max-md:grid-cols-1">
        <img className="aspect-video rounded-[8px] object-cover shadow-xl" src="/assets/verification-workflow.png" alt="Vendor verification workflow" />
        <figcaption className="text-sm leading-7 text-[#5f6670]">
          New buyer requests enter a review queue before becoming qualified opportunities.
          This keeps the marketplace credible as supply and demand grow.
        </figcaption>
      </figure>
    </section>
  );
}

function ModerationQueue({
  leads,
  vendors,
  onStatus
}: {
  leads: Lead[];
  vendors: Vendor[];
  onStatus: (id: string, status: LeadStatus) => void;
}) {
  return (
    <section id="moderation" className="rounded-[8px] border border-[#141414]/10 bg-white p-7">
      <div className="flex items-end justify-between gap-4 max-sm:block">
        <p className="text-xs font-black uppercase text-[#c79f1d]">Admin view</p>
        <h2 className="text-3xl font-black text-[#141414]">Moderation queue</h2>
      </div>
      <div className="mt-6 grid gap-3">
        {leads.map((lead) => {
          const vendor = vendors.find((item) => item.slug === lead.vendorSlug);
          return (
            <article key={lead.id} className="grid grid-cols-[1fr_0.78fr_auto] gap-5 rounded-[8px] border border-[#141414]/10 bg-[#fbfcff] p-5 max-lg:grid-cols-1">
              <div>
                <Badge tone={statusTone(lead.status)}>{statusLabels[lead.status]}</Badge>
                <h3 className="mt-3 text-xl font-black text-[#141414]">{lead.company}</h3>
                <p className="mt-3 text-sm text-[#5f6670]">{lead.need}</p>
              </div>
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-xs font-black uppercase text-[#5f6670]">Contact</dt>
                  <dd>{lead.name} / {lead.email}</dd>
                </div>
                <div>
                  <dt className="text-xs font-black uppercase text-[#5f6670]">Vendor</dt>
                  <dd>{vendor?.name || lead.vendorSlug}</dd>
                </div>
                <div>
                  <dt className="text-xs font-black uppercase text-[#5f6670]">Timeline</dt>
                  <dd>{lead.timeline}</dd>
                </div>
              </dl>
              <div className="flex gap-2 self-start">
                <Button variant="ghost" onClick={() => onStatus(lead.id, "qualified")}>
                  <CheckCircle2 className="size-4" />
                  Qualify
                </Button>
                <Button variant="ghost" onClick={() => onStatus(lead.id, "archived")}>
                  <Archive className="size-4" />
                  Archive
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function VendorProfile({
  vendor,
  onLead
}: {
  vendor: Vendor | null;
  onLead: (payload: Record<string, string>) => Promise<void>;
}) {
  const [status, setStatus] = useState("");

  if (!vendor) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl p-6">
        <Button variant="secondary" onClick={() => navigate("/")}>
          <ArrowLeft className="size-4" />
          Back to directory
        </Button>
        <div className="mt-6 rounded-[8px] border border-dashed border-[#141414]/20 bg-white p-8">
          Vendor not found.
        </div>
      </main>
    );
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries()) as Record<string, string>;
    payload.vendorSlug = vendor.slug;
    try {
      await onLead(payload);
      form.reset();
      setStatus("Lead submitted for moderation.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Lead submission failed.");
    }
  }

  return (
    <main className="mx-auto max-w-[1540px] px-5 py-6">
      <Button variant="secondary" onClick={() => navigate("/")}>
        <ArrowLeft className="size-4" />
        Back to directory
      </Button>
      <section className="mt-5 overflow-hidden rounded-[8px] border border-[#141414]/10 bg-white shadow-[0_24px_70px_rgba(1,22,56,0.1)]">
        <div className="grid gap-6 bg-gradient-to-br from-[#011638] via-[#0d21a1] to-[#141414] p-8 text-white md:grid-cols-[1fr_auto]">
          <div>
            <Badge tone={statusTone(vendor.verificationStatus)}>{statusLabels[vendor.verificationStatus]}</Badge>
            <h1 className="mt-4 text-5xl font-black leading-tight">{vendor.name}</h1>
            <p className="mt-4 max-w-3xl text-lg text-white/78">{vendor.tagline}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {vendor.services.map((service) => (
                <Badge key={service}>{service}</Badge>
              ))}
            </div>
          </div>
          <div className="grid size-32 place-items-center rounded-[8px] border border-white/20 bg-white text-[#141414]">
            <strong className="text-5xl font-black">{vendor.leadScore}</strong>
            <span className="text-sm font-black text-[#5f6670]">fit score</span>
          </div>
        </div>

        <div className="grid gap-5 p-6 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-[8px] border border-[#141414]/10 bg-[#fbfcff] p-5">
            <h2 className="text-xl font-black text-[#141414]">Overview</h2>
            <p className="mt-3 leading-7 text-[#5f6670]">{vendor.profile}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm max-sm:grid-cols-1">
              {[
                ["Headquarters", vendor.headquarters],
                ["Founded", String(vendor.founded)],
                ["Team size", vendor.teamSize],
                ["Response", vendor.responseTime]
              ].map(([term, detail]) => (
                <div key={term}>
                  <dt className="text-xs font-black uppercase text-[#5f6670]">{term}</dt>
                  <dd className="mt-1 text-[#141414]">{detail}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rounded-[8px] border border-[#141414]/10 bg-[#fbfcff] p-5">
            <h2 className="text-xl font-black text-[#141414]">Capabilities</h2>
            <ul className="mt-3 grid gap-2 text-sm text-[#5f6670]">
              {vendor.capabilities.map((item) => (
                <li key={item} className="flex gap-2">
                  <Sparkles className="mt-0.5 size-4 text-[#0d21a1]" />
                  {item}
                </li>
              ))}
            </ul>
            <h2 className="mt-6 text-xl font-black text-[#141414]">Open opportunities</h2>
            <ul className="mt-3 grid gap-2 text-sm text-[#5f6670]">
              {vendor.opportunities.map((item) => (
                <li key={item} className="flex gap-2">
                  <Boxes className="mt-0.5 size-4 text-[#c79f1d]" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <form onSubmit={submitLead} className="grid gap-4 border-t border-[#141414]/10 bg-[#eef0f2] p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className="text-xs font-black uppercase text-[#c79f1d]">Buyer inquiry</p>
            <h2 className="mt-2 text-2xl font-black text-[#141414]">Route a lead to review</h2>
          </div>
          {[
            ["company", "Company"],
            ["name", "Your name"],
            ["email", "Email"],
            ["timeline", "Timeline"]
          ].map(([name, label]) => (
            <label key={name} className="grid gap-1.5">
              <span className="text-xs font-black uppercase text-[#5f6670]">{label}</span>
              <input className="h-11 rounded-[7px] border border-[#141414]/10 bg-white px-3 font-bold outline-none focus:ring-3 focus:ring-[#0d21a1]/15" name={name} type={name === "email" ? "email" : "text"} required />
            </label>
          ))}
          <label className="grid gap-1.5 md:col-span-2">
            <span className="text-xs font-black uppercase text-[#5f6670]">Need</span>
            <textarea className="min-h-28 rounded-[7px] border border-[#141414]/10 bg-white p-3 font-bold outline-none focus:ring-3 focus:ring-[#0d21a1]/15" name="need" required />
          </label>
          <Button className="md:col-span-2" type="submit">
            <Send className="size-4" />
            Submit lead
          </Button>
          {status && <p className="text-sm font-black text-[#0d21a1] md:col-span-2">{status}</p>}
        </form>
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#141414]/10 bg-white/88 px-5 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-4">
        <button className="flex items-center gap-3 text-left" onClick={() => navigate("/")}>
          <span className="grid size-11 overflow-hidden rounded-[8px] border border-[#141414]/10 bg-[#eef0f2]">
            <img src="/assets/technoseller-logo-concept.png" alt="" className="size-full object-cover" />
          </span>
          <span>
            <strong className="block text-sm font-black text-[#141414]">TECHNOseller Portal</strong>
            <span className="text-xs text-[#5f6670]">Vendor discovery and trade services</span>
          </span>
        </button>
        <nav className="flex gap-2 text-sm font-bold text-[#5f6670] max-sm:hidden">
          <button className="rounded-[7px] px-3 py-2 hover:bg-[#eef0f2]" onClick={() => navigate("/")}>Directory</button>
          <button className="rounded-[7px] px-3 py-2 hover:bg-[#eef0f2]" onClick={() => document.getElementById("lead-flow")?.scrollIntoView({ behavior: "smooth" })}>Leads</button>
          <button className="rounded-[7px] px-3 py-2 hover:bg-[#eef0f2]" onClick={() => document.getElementById("moderation")?.scrollIntoView({ behavior: "smooth" })}>Moderation</button>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [activeView, setActiveView] = useState<ViewKey>("all");
  const [path, setPath] = useState(window.location.pathname);
  const [activeVendor, setActiveVendor] = useState<Vendor | null>(null);

  const vendorSlug = useMemo(() => path.match(/^\/vendors\/([a-z0-9-]+)$/)?.[1], [path]);

  useEffect(() => {
    function syncPath() {
      setPath(window.location.pathname);
    }
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  useEffect(() => {
    request<{ taxonomy: Taxonomy; summary: Summary }>("/api/taxonomy").then((payload) => {
      setTaxonomy(payload.taxonomy);
      setSummary(payload.summary);
    });
    request<{ leads: Lead[] }>("/api/admin/leads").then((payload) => setLeads(payload.leads));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    request<{ vendors: Vendor[]; summary: Summary }>(`/api/vendors?${params.toString()}`).then((payload) => {
      setVendors(payload.vendors);
      setSummary(payload.summary);
    });
  }, [filters]);

  useEffect(() => {
    if (!vendorSlug) {
      setActiveVendor(null);
      return;
    }
    request<{ vendor: Vendor }>(`/api/vendors/${vendorSlug}`)
      .then((payload) => setActiveVendor(payload.vendor))
      .catch(() => setActiveVendor(null));
  }, [vendorSlug]);

  function updateFilters(next: Filters) {
    setFilters(next);
    setActiveView("all");
  }

  function applyView(view: ViewKey) {
    setActiveView(view);
    setFilters({ ...defaultFilters, ...viewFilters[view] });
  }

  async function updateLeadStatus(id: string, status: LeadStatus) {
    const payload = await request<{ lead: Lead }>(`/api/admin/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    setLeads((items) => items.map((lead) => (lead.id === id ? payload.lead : lead)));
  }

  async function submitLead(payload: Record<string, string>) {
    await request<{ lead: Lead }>("/api/leads", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const queue = await request<{ leads: Lead[] }>("/api/admin/leads");
    setLeads(queue.leads);
  }

  if (vendorSlug) {
    return (
      <>
        <Header />
        <VendorProfile vendor={activeVendor} onLead={submitLead} />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-[1540px] gap-6 px-5 py-6">
        <Hero
          taxonomy={taxonomy}
          filters={filters}
          activeView={activeView}
          vendorCount={vendors.length}
          onFilters={updateFilters}
          onView={applyView}
        />
        <section className="grid grid-cols-4 overflow-hidden rounded-[8px] border border-[#141414]/10 shadow-sm max-md:grid-cols-2">
          <StatTile value={summary?.vendorCount || 0} label="vendors" />
          <StatTile value={summary?.regionCount || 0} label="regions" />
          <StatTile value={summary?.serviceCount || 0} label="service lines" />
          <StatTile value={summary?.verifiedCount || 0} label="verified" />
        </section>
        <section className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <InsightPanel />
          <Directory vendors={vendors} sort={filters.sort} />
        </section>
        <ServiceTracks />
        <RegionalIntelligence />
        <OperatingSystem />
        <PlatformDepth />
        <LeadFlow />
        <ModerationQueue leads={leads} vendors={vendors} onStatus={updateLeadStatus} />
      </main>
      <footer className="mt-8 border-t border-[#141414]/10 px-5 py-8 text-sm text-[#5f6670]">
        <div className="mx-auto flex max-w-[1540px] justify-between gap-4 max-sm:block">
          <p>
            TECHNOseller Portal is a clean public concept using synthetic marketplace data only.
            Design, product direction, and frontend/backend implementation by{" "}
            <a className="font-black text-[#0d21a1]" href="https://syhtek.com" rel="noreferrer" target="_blank">
              SYHTEK
            </a>
            .
          </p>
          <div className="flex gap-4 max-sm:mt-3">
            <a className="font-black text-[#0d21a1]" href="https://syhtek.com" rel="noreferrer" target="_blank">
              Inquiries
            </a>
            <a className="font-black text-[#0d21a1]" href="/api/health">API status</a>
          </div>
        </div>
      </footer>
    </>
  );
}
