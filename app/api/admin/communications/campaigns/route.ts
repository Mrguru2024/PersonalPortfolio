import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import type { CommSegmentFilters } from "@shared/communicationsSchema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const campaigns = await storage.listCommCampaigns();
    const withDesigns = await Promise.all(
      campaigns.map(async (c) => {
        const design = await storage.getCommEmailDesignById(c.emailDesignId);
        return { ...c, design: design ? { id: design.id, name: design.name, subject: design.subject } : null };
      })
    );
    return NextResponse.json(withDesigns);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to list campaigns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const emailDesignId = Number(body.emailDesignId);
    if (!name || !Number.isFinite(emailDesignId)) {
      return NextResponse.json({ error: "name and emailDesignId are required" }, { status: 400 });
    }
    const design = await storage.getCommEmailDesignById(emailDesignId);
    if (!design) return NextResponse.json({ error: "Design not found" }, { status: 404 });

    const abTestEnabled = !!body.abTestEnabled;
    const variantEmailDesignId =
      body.variantEmailDesignId != null && body.variantEmailDesignId !== "" ?
        Number(body.variantEmailDesignId)
      : null;
    const abVariantBPercent =
      body.abVariantBPercent != null && body.abVariantBPercent !== "" ?
        Math.min(100, Math.max(0, Number(body.abVariantBPercent)))
      : 50;
    const organizationId =
      body.organizationId != null && body.organizationId !== "" ? Number(body.organizationId) : null;

    if (abTestEnabled) {
      if (variantEmailDesignId == null || !Number.isFinite(variantEmailDesignId)) {
        return NextResponse.json({ error: "A/B test requires variantEmailDesignId" }, { status: 400 });
      }
      if (variantEmailDesignId === emailDesignId) {
        return NextResponse.json({ error: "Variant design must differ from the primary design" }, { status: 400 });
      }
      const vDesign = await storage.getCommEmailDesignById(variantEmailDesignId);
      if (!vDesign) return NextResponse.json({ error: "Variant design not found" }, { status: 404 });
    }

    let segmentFilters = (body.segmentFilters ?? {}) as CommSegmentFilters;
    const savedListId = body.savedListId != null ? Number(body.savedListId) : null;
    if (savedListId && Number.isFinite(savedListId)) {
      const list = await storage.getCrmSavedListById(savedListId);
      if (list?.filters) {
        segmentFilters = { ...list.filters, ...segmentFilters };
      }
    }
    const row = await storage.createCommCampaign({
      name,
      description: typeof body.description === "string" ? body.description : null,
      campaignType: typeof body.campaignType === "string" ? body.campaignType : "one_time",
      emailDesignId,
      variantEmailDesignId: abTestEnabled && variantEmailDesignId ? variantEmailDesignId : null,
      abTestEnabled,
      abVariantBPercent,
      organizationId: organizationId && Number.isFinite(organizationId) ? organizationId : null,
      segmentFilters,
      savedListId,
      offerSlug: typeof body.offerSlug === "string" ? body.offerSlug : null,
      leadMagnetId: body.leadMagnetId != null ? Number(body.leadMagnetId) : null,
      landingPageUrl: typeof body.landingPageUrl === "string" ? body.landingPageUrl : null,
      targetPersonaIdsJson: Array.isArray(body.targetPersonaIdsJson) ? body.targetPersonaIdsJson.map(String) : [],
      sendMode: body.sendMode === "scheduled" ? "scheduled" : "immediate",
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      utmSource: typeof body.utmSource === "string" ? body.utmSource : null,
      utmMedium: typeof body.utmMedium === "string" ? body.utmMedium : null,
      utmCampaign: typeof body.utmCampaign === "string" ? body.utmCampaign : null,
      notes: typeof body.notes === "string" ? body.notes : null,
      status: "draft",
      createdBy: user?.id ?? null,
    });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
