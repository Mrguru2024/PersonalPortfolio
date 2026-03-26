import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { logActivity } from "@server/services/crmFoundationService";
import type { InsertCrmContact } from "@shared/crmSchema";

export const dynamic = "force-dynamic";

/** Parse a single CSV line handling quoted fields (e.g. "Smith, John", "a@b.com") */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      i += 1;
      let field = "";
      while (i < line.length) {
        if (line[i] === '"') {
          i += 1;
          if (line[i] === '"') {
            field += '"';
            i += 1;
          } else break;
        } else {
          field += line[i];
          i += 1;
        }
      }
      out.push(field);
      if (line[i] === ",") i += 1;
    } else {
      const comma = line.indexOf(",", i);
      if (comma === -1) {
        out.push(line.slice(i).trim());
        break;
      }
      out.push(line.slice(i, comma).trim());
      i = comma + 1;
    }
  }
  return out;
}

/** Normalize header to a known key (name, email, phone, company, job_title, industry, notes, source) */
const HEADER_MAP: Record<string, string> = {
  name: "name",
  fullname: "name",
  "full name": "name",
  contact: "name",
  email: "email",
  "e-mail": "email",
  phone: "phone",
  telephone: "phone",
  mobile: "phone",
  company: "company",
  organization: "company",
  org: "company",
  "job title": "job_title",
  job_title: "job_title",
  jobtitle: "job_title",
  title: "job_title",
  role: "job_title",
  industry: "industry",
  notes: "notes",
  note: "notes",
  source: "source",
  "lead source": "source",
};

function normalizeHeader(h: string): string {
  const key = h.trim().toLowerCase().replace(/\s+/g, " ");
  return HEADER_MAP[key] ?? key;
}

/** Parse CSV text into rows of keyed objects. First row is headers if they match known names. */
function parseCsvToRows(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const rawHeaders = parseCsvLine(lines[0]);
  const normalized = rawHeaders.map(normalizeHeader);
  const hasKnownHeaders = normalized.some((h) => h === "name" || h === "email");
  const headers = hasKnownHeaders ? normalized : rawHeaders.map((_, i) => (i === 0 ? "name" : i === 1 ? "email" : `col_${i}`));
  const start = hasKnownHeaders ? 1 : 0;
  const rows: Record<string, string>[] = [];
  for (let i = start; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j]?.trim() ?? "";
    });
    rows.push(row);
  }
  return { headers, rows };
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

/**
 * POST /api/admin/crm/contacts/import
 * Body (JSON): { pasted: string, source?: string }
 * Or multipart/form-data: file (CSV), source (optional)
 * Returns: { created, skipped, errors: { row, message }[] }
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    let csvText: string;
    let defaultSource = "import";

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const sourceParam = formData.get("source");
      if (sourceParam && typeof sourceParam === "string") defaultSource = sourceParam.trim() || defaultSource;
      if (!file || file.size === 0) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      const body = await req.json();
      if (!body.pasted || typeof body.pasted !== "string") {
        return NextResponse.json({ error: "Missing pasted text. Send { pasted: string }." }, { status: 400 });
      }
      csvText = body.pasted;
      if (body.source && typeof body.source === "string") defaultSource = body.source.trim() || defaultSource;
    }

    const { rows } = parseCsvToRows(csvText);
    const user = await getSessionUser(req);
    const created: number[] = [];
    const errors: { row: number; message: string }[] = [];
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const email = (r.email ?? "").trim();
      const name = (r.name ?? "").trim() || email || `Imported row ${i + 1}`;
      if (!email) {
        errors.push({ row: i + 1, message: "Missing email" });
        skipped += 1;
        continue;
      }
      if (!isValidEmail(email)) {
        errors.push({ row: i + 1, message: "Invalid email" });
        skipped += 1;
        continue;
      }

      const existing = await storage.getCrmContactsByEmails([email]);
      if (existing.length > 0) {
        skipped += 1;
        errors.push({ row: i + 1, message: "Email already in CRM" });
        continue;
      }

      const payload: InsertCrmContact = {
        type: "lead",
        name,
        email,
        phone: (r.phone ?? "").trim() || null,
        company: (r.company ?? "").trim() || null,
        jobTitle: (r.job_title ?? "").trim() || null,
        industry: (r.industry ?? "").trim() || null,
        notes: (r.notes ?? "").trim() || null,
        source: (r.source ?? "").trim() || defaultSource,
        status: "new",
        createdByUserId: user?.id ?? null,
      };

      try {
        const contact = await storage.createCrmContact(payload);
        created.push(contact.id);
        logActivity(storage, {
          contactId: contact.id,
          type: "contact_created",
          title: "Contact imported",
          content: contact.name,
          createdByUserId: user?.id,
        }).catch(() => {});
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push({ row: i + 1, message: msg });
        skipped += 1;
      }
    }

    return NextResponse.json({
      created: created.length,
      skipped,
      errors,
      createdIds: created,
    });
  } catch (error: unknown) {
    console.error("CRM import error:", error);
    return NextResponse.json(
      { error: "Import failed" },
      { status: 500 }
    );
  }
}
