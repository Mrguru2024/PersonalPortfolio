import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Admin-only temporary brand asset folders (documents vs images).
 * Files expire after `expiresAt` (default 90 days from upload); cron removes DB rows and disk files.
 */
export const brandTempFolders = pgTable("brand_temp_folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  /** "documents" | "images" — upload API enforces MIME allowlists */
  folderKind: text("folder_kind").notNull().default("documents"),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const brandTempFiles = pgTable("brand_temp_files", {
  id: serial("id").primaryKey(),
  folderId: integer("folder_id")
    .notNull()
    .references(() => brandTempFolders.id, { onDelete: "cascade" }),
  originalFilename: text("original_filename").notNull(),
  /** Path served from site root, e.g. /uploads/brand-temp/{folderId}/{uuid}.pdf */
  publicPath: text("public_path").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type BrandTempFolder = typeof brandTempFolders.$inferSelect;
export type InsertBrandTempFolder = typeof brandTempFolders.$inferInsert;
export type BrandTempFile = typeof brandTempFiles.$inferSelect;
export type InsertBrandTempFile = typeof brandTempFiles.$inferInsert;

/** Default retention for brand temp uploads */
export const BRAND_TEMP_RETENTION_DAYS = 90;

/** App-side max upload size (API enforces this). Hosting (e.g. Vercel serverless ~4.5MB) may reject earlier with HTTP 413. */
export const BRAND_VAULT_MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
