import { pgTable, text, timestamp, real, integer, jsonb, uuid, boolean, varchar, decimal } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const savedAssumptions = pgTable("saved_assumptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  name: text("name").notNull(),
  assumptions: jsonb("assumptions").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pricingModels = pgTable("pricing_models", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // retail, wholesale, reseller
  margins: jsonb("margins").notNull(),
  fees: jsonb("fees").notNull(),
  discountTiers: jsonb("discount_tiers").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productSizes = pgTable("product_sizes", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  width: real("width").notNull(),
  height: real("height").notNull(),
  label: text("label").notNull(),
  retailPrice: real("retail_price"),
  wholesalePrice: real("wholesale_price"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scenarios = pgTable("scenarios", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  assumptions: jsonb("assumptions").notNull(),
  isPreset: boolean("is_preset").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scenarioResults = pgTable("scenario_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  scenarioId: uuid("scenario_id").references(() => scenarios.id),
  results: jsonb("results").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customerPriceSheets = pgTable("customer_price_sheets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // retail, wholesale, reseller
  config: jsonb("config").notNull(),
  pricing: jsonb("pricing").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const infographicConfigs = pgTable("infographic_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // internal, customer
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const exports = pgTable("exports", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  type: text("type").notNull(),
  format: text("format").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const companySettings = pgTable("company_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Editable internal docs / SOPs surfaced under /admin/sops/[slug]. Markdown
// content stored as text; revisions live in `sopRevisions` for history.
export const sops = pgTable("sops", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  version: varchar("version", { length: 32 }),
  owner: text("owner"),
  effective: text("effective"),
  contentMd: text("content_md").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sopRevisions = pgTable("sop_revisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sopId: uuid("sop_id").references(() => sops.id, { onDelete: "cascade" }).notNull(),
  contentMd: text("content_md").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Image Studio — pinned/favorited prompts. Single-tenant for now (no user
// scope). Unique on `prompt` so toggling is idempotent.
export const promptFavorites = pgTable("prompt_favorites", {
  id: uuid("id").defaultRandom().primaryKey(),
  prompt: text("prompt").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Image Studio — every Gemini image generation (and upscale derivative) is
// recorded here for cost tracking, QC history, and re-fetching.
export const imageGenerations = pgTable("image_generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  prompt: text("prompt").notNull(),
  tier: varchar("tier", { length: 20 }).notNull(), // 'preview' | 'production' | 'upscale'
  model: varchar("model", { length: 64 }).notNull(),
  resolution: varchar("resolution", { length: 20 }), // '1K' | '2K' | '4K'
  aspectRatio: varchar("aspect_ratio", { length: 10 }),
  printTarget: varchar("print_target", { length: 64 }),
  imageUrl: text("image_url").notNull(),
  widthPx: integer("width_px"),
  heightPx: integer("height_px"),
  effectiveDpi: integer("effective_dpi"),
  qcResults: jsonb("qc_results"),
  upscaled: boolean("upscaled").default(false),
  upscaleParentId: uuid("upscale_parent_id"),
  costUsd: decimal("cost_usd", { precision: 10, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Custom orders — manually-entered orders that don't come from exora.ink
// (phone, email, walk-in, invoice). Mirrors the WooCommerce vocabulary for
// status so operators have one mental model across both dashboards.
// ---------------------------------------------------------------------------
export const customOrders = pgTable("custom_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Human-readable order number, auto-generated like "C-1042". */
  orderNumber: text("order_number").notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("processing"),
  /** Origin / how the order came in. */
  source: varchar("source", { length: 32 }).default("manual"),
  // Customer
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  customerCompany: text("customer_company"),
  // Shipping (free-form text — keep it simple)
  shippingAddress: text("shipping_address"),
  // Money
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0.00"),
  currency: varchar("currency", { length: 8 }).notNull().default("USD"),
  paymentMethod: text("payment_method"),
  paymentReceived: boolean("payment_received").default(false).notNull(),
  // Notes
  customerNote: text("customer_note"),
  internalNotes: text("internal_notes"),
  // Lifecycle
  dueDate: timestamp("due_date", { mode: "date" }),
  completedAt: timestamp("completed_at"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customOrderItems = pgTable("custom_order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => customOrders.id, { onDelete: "cascade" }),
  /** Description of the item — free-form (e.g. "10x12 DTF transfer, 2 colors"). */
  name: text("name").notNull(),
  sku: text("sku"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0.00"),
  notes: text("notes"),
  position: integer("position").default(0).notNull(),
});
