/** Aggregates for admin LTV / revenue snapshot (CRM deals + contact estimates). */

export type CrmLtvSourceRow = {
  source: string;
  totalCents: number;
  contactCount: number;
};

/** High-value contacts for quick links from the LTV workspace */
export type CrmLtvTopContactRow = {
  id: number;
  name: string;
  company: string | null;
  type: string;
  estimatedValueCents: number;
};

export type CrmLtvSnapshot = {
  wonDealValueCents: number;
  openPipelineValueCents: number;
  clientCount: number;
  clientsWithEstimateCount: number;
  totalClientEstimatedLtvCents: number;
  avgClientEstimatedLtvCents: number | null;
  leadsWithEstimateCount: number;
  totalLeadEstimatedValueCents: number;
  contactsMissingEstimateCount: number;
  topSourcesByValue: CrmLtvSourceRow[];
  topContactsByEstimate: CrmLtvTopContactRow[];
};

/** Inputs for a parameterized LTV / revenue report (filters + optional scenario overlays). */
export type CrmLtvReportParams = {
  contactTypeFilter: "all" | "lead" | "client";
  /** Only contacts with estimated value at least this many cents contribute to rollups, top lists, and sources. */
  minEstimatedValueCents: number;
  topContactsLimit: number;
  topSourcesLimit: number;
  /** Which deals contribute to won vs open totals on the board. */
  dealView: "all" | "won_only" | "open_only";
  /** Percent applied to total client-estimated LTV (after filters). 10 means +10%. */
  clientLtvUpliftPercent: number;
  /** If set, each lead in scope without a positive estimate adds this many cents to the scenario line only. */
  imputedMissingLeadEstimateCents: number | null;
};

export const DEFAULT_CRM_LTV_REPORT_PARAMS: CrmLtvReportParams = {
  contactTypeFilter: "all",
  minEstimatedValueCents: 0,
  topContactsLimit: 12,
  topSourcesLimit: 8,
  dealView: "all",
  clientLtvUpliftPercent: 0,
  imputedMissingLeadEstimateCents: null,
};

export type CrmLtvScenarioAdjustment = {
  label: string;
  valueCents: number;
};

export type CrmLtvReport = CrmLtvSnapshot & {
  reportMeta: {
    params: CrmLtvReportParams;
    generatedAt: string;
  };
  /** Optional scenario overlay: uplift + imputed missing lead value. */
  scenarioAdjustments: CrmLtvScenarioAdjustment[];
  /** Client-side LTV proxy after uplift and imputed missing-lead rows; null when no scenario inputs. */
  combinedScenarioClientLtvCents: number | null;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function parseIntParam(v: string | null | undefined, fallback: number): number {
  if (v == null || v === "") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseFloatParam(v: string | null | undefined, fallback: number): number {
  if (v == null || v === "") return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Serialize params for `/api/admin/crm/ltv/report` (JSON or CSV). */
export function serializeCrmLtvReportParams(params: CrmLtvReportParams): string {
  const sp = new URLSearchParams();
  sp.set("contactType", params.contactTypeFilter);
  sp.set("minEstimatedDollars", String(params.minEstimatedValueCents / 100));
  sp.set("topContacts", String(params.topContactsLimit));
  sp.set("topSources", String(params.topSourcesLimit));
  sp.set("dealView", params.dealView);
  sp.set("upliftPercent", String(params.clientLtvUpliftPercent));
  if (params.imputedMissingLeadEstimateCents != null && params.imputedMissingLeadEstimateCents > 0) {
    sp.set("imputeMissingLeadDollars", String(params.imputedMissingLeadEstimateCents / 100));
  }
  return sp.toString();
}

/** Parse LTV report params from a query string (admin report builder + CSV export). */
export function parseCrmLtvReportParamsFromSearchParams(searchParams: URLSearchParams): CrmLtvReportParams {
  const typeRaw = (searchParams.get("contactType") ?? "all").toLowerCase();
  const contactTypeFilter: CrmLtvReportParams["contactTypeFilter"] =
    typeRaw === "lead" || typeRaw === "client" ? typeRaw : "all";

  const dealRaw = (searchParams.get("dealView") ?? "all").toLowerCase();
  const dealView: CrmLtvReportParams["dealView"] =
    dealRaw === "won_only" || dealRaw === "open_only" ? dealRaw : "all";

  const minDollars = parseFloatParam(searchParams.get("minEstimatedDollars"), 0);
  const minEstimatedValueCents = Math.max(0, Math.round(minDollars * 100));

  const topContactsLimit = clamp(parseIntParam(searchParams.get("topContacts"), 12), 5, 100);
  const topSourcesLimit = clamp(parseIntParam(searchParams.get("topSources"), 8), 3, 30);

  const clientLtvUpliftPercent = clamp(parseFloatParam(searchParams.get("upliftPercent"), 0), -90, 500);

  const imputeRaw = searchParams.get("imputeMissingLeadDollars");
  let imputedMissingLeadEstimateCents: number | null = null;
  if (imputeRaw != null && imputeRaw !== "") {
    const dollars = Number.parseFloat(imputeRaw);
    if (Number.isFinite(dollars) && dollars >= 0) {
      imputedMissingLeadEstimateCents = Math.round(dollars * 100);
    }
  }

  return {
    contactTypeFilter,
    minEstimatedValueCents,
    topContactsLimit,
    topSourcesLimit,
    dealView,
    clientLtvUpliftPercent,
    imputedMissingLeadEstimateCents,
  };
}

function csvEscape(cell: string): string {
  if (/[",\n\r]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

/** Build a simple CSV for download (metrics + top sources + top contacts). */
export function formatCrmLtvReportAsCsv(report: CrmLtvReport): string {
  const lines: string[] = [];
  const p = report.reportMeta.params;
  lines.push("section,field,value");
  lines.push(`meta,generatedAt,${csvEscape(report.reportMeta.generatedAt)}`);
  lines.push(`meta,contactTypeFilter,${csvEscape(p.contactTypeFilter)}`);
  lines.push(`meta,minEstimatedValueCents,${p.minEstimatedValueCents}`);
  lines.push(`meta,dealView,${csvEscape(p.dealView)}`);
  lines.push(`meta,upliftPercent,${p.clientLtvUpliftPercent}`);
  lines.push(
    `meta,imputedMissingLeadEstimateCents,${p.imputedMissingLeadEstimateCents ?? ""}`,
  );

  lines.push(`metric,wonDealValueCents,${report.wonDealValueCents}`);
  lines.push(`metric,openPipelineValueCents,${report.openPipelineValueCents}`);
  lines.push(`metric,clientCount,${report.clientCount}`);
  lines.push(`metric,clientsWithEstimateCount,${report.clientsWithEstimateCount}`);
  lines.push(`metric,totalClientEstimatedLtvCents,${report.totalClientEstimatedLtvCents}`);
  lines.push(`metric,avgClientEstimatedLtvCents,${report.avgClientEstimatedLtvCents ?? ""}`);
  lines.push(`metric,leadsWithEstimateCount,${report.leadsWithEstimateCount}`);
  lines.push(`metric,totalLeadEstimatedValueCents,${report.totalLeadEstimatedValueCents}`);
  lines.push(`metric,contactsMissingEstimateCount,${report.contactsMissingEstimateCount}`);
  lines.push(`metric,combinedScenarioClientLtvCents,${report.combinedScenarioClientLtvCents ?? ""}`);

  for (const adj of report.scenarioAdjustments) {
    lines.push(`scenario,${csvEscape(adj.label)},${adj.valueCents}`);
  }

  lines.push("top_source,source,totalCents,contactCount");
  for (const row of report.topSourcesByValue) {
    lines.push(`top_source,${csvEscape(row.source)},${row.totalCents},${row.contactCount}`);
  }

  lines.push("top_contact,id,name,company,type,estimatedValueCents");
  for (const c of report.topContactsByEstimate) {
    lines.push(
      [
        "top_contact",
        String(c.id),
        csvEscape(c.name),
        csvEscape(c.company ?? ""),
        csvEscape(c.type),
        String(c.estimatedValueCents),
      ].join(","),
    );
  }

  return lines.join("\r\n");
}
