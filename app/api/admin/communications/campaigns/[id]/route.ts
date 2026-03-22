import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import type { CommSegmentFilters } from "@shared/communicationsSchema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const campaign = await storage.getCommCampaignById(id);
    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const design = await storage.getCommEmailDesignById(campaign.emailDesignId);
    const variantDesign =
      campaign.variantEmailDesignId ?
        await storage.getCommEmailDesignById(campaign.variantEmailDesignId)
      : null;
    const sends = await storage.getCommCampaignSendsByCampaignId(id);
    return NextResponse.json({
      ...campaign,
      design: design ?? null,
      variantDesign: variantDesign ?? null,
      sends,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load campaign" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const id = Number((await params).id);
    const existing = await storage.getCommCampaignById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (typeof body.description === "string") updates.description = body.description;
    if (typeof body.campaignType === "string") updates.campaignType = body.campaignType;
    if (body.segmentFilters != null) updates.segmentFilters = body.segmentFilters as CommSegmentFilters;
    if (body.savedListId !== undefined) updates.savedListId = body.savedListId != null ? Number(body.savedListId) : null;
    if (typeof body.offerSlug === "string") updates.offerSlug = body.offerSlug;
    if (body.leadMagnetId !== undefined) updates.leadMagnetId = body.leadMagnetId != null ? Number(body.leadMagnetId) : null;
    if (typeof body.landingPageUrl === "string") updates.landingPageUrl = body.landingPageUrl;
    if (Array.isArray(body.targetPersonaIdsJson)) updates.targetPersonaIdsJson = body.targetPersonaIdsJson.map(String);
    if (body.sendMode === "scheduled" || body.sendMode === "immediate") updates.sendMode = body.sendMode;
    if (body.scheduledAt !== undefined) updates.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    if (typeof body.utmSource === "string") updates.utmSource = body.utmSource;
    if (typeof body.utmMedium === "string") updates.utmMedium = body.utmMedium;
    if (typeof body.utmCampaign === "string") updates.utmCampaign = body.utmCampaign;
    if (typeof body.notes === "string") updates.notes = body.notes;
    if (body.emailDesignId != null) updates.emailDesignId = Number(body.emailDesignId);
    if (body.abTestEnabled !== undefined) updates.abTestEnabled = !!body.abTestEnabled;
    if (body.abVariantBPercent !== undefined) {
      const p = Number(body.abVariantBPercent);
      if (Number.isFinite(p)) updates.abVariantBPercent = Math.min(100, Math.max(0, p));
    }
    if (body.variantEmailDesignId !== undefined) {
      updates.variantEmailDesignId =
        body.variantEmailDesignId != null && body.variantEmailDesignId !== "" ?
          Number(body.variantEmailDesignId)
        : null;
    }
    if (body.organizationId !== undefined) {
      updates.organizationId =
        body.organizationId != null && body.organizationId !== "" ? Number(body.organizationId) : null;
    }

    const nextPrimary = (updates.emailDesignId as number | undefined) ?? existing.emailDesignId;
    const nextAb = (updates.abTestEnabled as boolean | undefined) ?? existing.abTestEnabled;
    const nextVar =
      (updates.variantEmailDesignId as number | null | undefined) !== undefined ?
        (updates.variantEmailDesignId as number | null)
      : existing.variantEmailDesignId;

    if (nextAb) {
      if (nextVar == null || !Number.isFinite(nextVar)) {
        return NextResponse.json({ error: "A/B test requires variantEmailDesignId" }, { status: 400 });
      }
      if (nextVar === nextPrimary) {
        return NextResponse.json({ error: "Variant design must differ from the primary design" }, { status: 400 });
      }
      const vd = await storage.getCommEmailDesignById(nextVar);
      if (!vd) return NextResponse.json({ error: "Variant design not found" }, { status: 404 });
    }

    const row = await storage.updateCommCampaign(id, updates as Parameters<typeof storage.updateCommCampaign>[1]);
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}
