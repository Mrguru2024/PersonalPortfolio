/**
 * Add Stripe-related columns to client_invoices.
 * Run: npx tsx scripts/add-invoice-stripe-columns.ts
 */
import { pool } from "../server/db";

const statements = [
  "ALTER TABLE client_invoices ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT",
  "ALTER TABLE client_invoices ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT",
  "ALTER TABLE client_invoices ADD COLUMN IF NOT EXISTS recipient_email TEXT",
  "ALTER TABLE client_invoices ADD COLUMN IF NOT EXISTS host_invoice_url TEXT",
  "ALTER TABLE client_invoices ADD COLUMN IF NOT EXISTS line_items JSONB",
  "ALTER TABLE client_invoices ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMP",
];

async function main() {
  const client = await pool.connect();
  try {
    for (const sql of statements) await client.query(sql);
    console.log("✅ client_invoices columns added (or already exist).");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
