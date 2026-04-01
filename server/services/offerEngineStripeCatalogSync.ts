import Stripe from "stripe";
import type { AscendraPricingPackage } from "@shared/ascendraPricingPackageTypes";
import { ensurePricingPackage, refreshPricingPackageComputed } from "@shared/ascendraPricingEngine";
import { getOfferTemplate, updateOfferTemplate } from "./offerEngineService";

function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

function dollarsToCents(n: number): number {
  return Math.max(0, Math.round(n * 100));
}

/** Opt-in: set `ASCENDRA_STRIPE_OFFER_SYNC=1` plus `STRIPE_SECRET_KEY`. */
export function isStripeOfferCatalogSyncEnabled(): boolean {
  return process.env.ASCENDRA_STRIPE_OFFER_SYNC?.trim() === "1" && !!process.env.STRIPE_SECRET_KEY?.trim();
}

export async function syncOfferTemplateStripeCatalog(offerTemplateId: number): Promise<
  | {
      ok: true;
      stripeProductId: string;
      stripePriceIdSetup: string;
      stripePriceIdMonthly: string;
      createdProduct: boolean;
      createdSetupPrice: boolean;
      createdMonthlyPrice: boolean;
    }
  | { ok: false; error: string; status: number }
> {
  if (!isStripeOfferCatalogSyncEnabled()) {
    return {
      ok: false,
      status: 503,
      error:
        "Stripe catalog sync is off. Set ASCENDRA_STRIPE_OFFER_SYNC=1 and STRIPE_SECRET_KEY, then retry.",
    };
  }

  const row = await getOfferTemplate(offerTemplateId);
  if (!row?.pricingPackageJson) {
    return { ok: false, status: 400, error: "Template has no pricing package." };
  }

  let pkg = ensurePricingPackage(row.pricingPackageJson);
  pkg = refreshPricingPackageComputed({ ...row, pricingPackageJson: pkg }, pkg);
  const setup = pkg.computed?.suggestedSetupUsd;
  const monthly = pkg.computed?.suggestedMonthlyUsd;
  if (setup == null || monthly == null || !Number.isFinite(setup) || !Number.isFinite(monthly)) {
    return {
      ok: false,
      status: 400,
      error: "Computed suggested DFY setup and monthly prices are required. Save the pricing tab first.",
    };
  }

  const stripe = stripeClient();
  const inputs = pkg.inputs ?? {};

  let stripeProductId = inputs.stripeProductId?.trim() || "";
  let createdProduct = false;
  if (!stripeProductId) {
    const product = await stripe.products.create({
      name: `${row.name} — DFY`,
      description: row.primaryPromise ?? undefined,
      metadata: { offer_engine_template_id: String(row.id), slug: row.slug },
    });
    stripeProductId = product.id;
    createdProduct = true;
  }

  let stripePriceIdSetup = inputs.stripePriceIdSetup?.trim() || "";
  let createdSetupPrice = false;
  if (!stripePriceIdSetup) {
    const p = await stripe.prices.create({
      product: stripeProductId,
      currency: "usd",
      unit_amount: dollarsToCents(setup),
      metadata: { kind: "dfy_setup", offer_engine_template_id: String(row.id) },
    });
    stripePriceIdSetup = p.id;
    createdSetupPrice = true;
  }

  let stripePriceIdMonthly = inputs.stripePriceIdMonthly?.trim() || "";
  let createdMonthlyPrice = false;
  if (!stripePriceIdMonthly) {
    const p = await stripe.prices.create({
      product: stripeProductId,
      currency: "usd",
      unit_amount: dollarsToCents(monthly),
      recurring: { interval: "month" },
      metadata: { kind: "dfy_monthly", offer_engine_template_id: String(row.id) },
    });
    stripePriceIdMonthly = p.id;
    createdMonthlyPrice = true;
  }

  const nextPkg: AscendraPricingPackage = {
    ...pkg,
    inputs: {
      ...inputs,
      stripeProductId,
      stripePriceIdSetup,
      stripePriceIdMonthly,
    },
  };

  await updateOfferTemplate(offerTemplateId, { pricingPackage: nextPkg });

  return {
    ok: true,
    stripeProductId,
    stripePriceIdSetup,
    stripePriceIdMonthly,
    createdProduct,
    createdSetupPrice,
    createdMonthlyPrice,
  };
}
