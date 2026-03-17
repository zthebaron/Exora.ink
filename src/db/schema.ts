import { pgTable, text, timestamp, real, integer, jsonb, uuid, boolean } from "drizzle-orm/pg-core";

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
