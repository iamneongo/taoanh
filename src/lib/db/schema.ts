import { pgTable, text, timestamp, uuid, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkOrgId: text("clerk_org_id").notNull().unique(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  roomDescription: text("room_description"),
  status: text("status", { enum: ["draft", "in_progress", "completed"] }).default("draft").notNull(),
  currentStep: integer("current_step").default(1).notNull(),
  settings: jsonb("settings").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectImages = pgTable("project_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["room_original", "generated"] }).notNull(),
  url: text("url"),
  b64Json: text("b64_json"),
  taskId: text("task_id"),
  taskStatus: text("task_status"),
  style: text("style"),
  prompt: text("prompt"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const itemCategories = pgTable("item_categories", {
  id:          uuid("id").primaryKey().defaultRandom(),
  orgId:       uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name:        text("name").notNull(),
  description: text("description"),
  sortOrder:   integer("sort_order").default(0).notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const catalogItems = pgTable("catalog_items", {
  id:          uuid("id").primaryKey().defaultRandom(),
  categoryId:  uuid("category_id").notNull().references(() => itemCategories.id, { onDelete: "cascade" }),
  orgId:       uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name:        text("name").notNull(),
  description: text("description"),
  imageUrl:    text("image_url"),
  imageData:   text("image_data"),
  active:      boolean("active").default(true).notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const designStyles = pgTable("design_styles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  nameVi: text("name_vi").notNull(),
  description: text("description"),
  previewUrl: text("preview_url"),
  promptTemplate: text("prompt_template").notNull(),
  priceRangeMin: integer("price_range_min"),
  priceRangeMax: integer("price_range_max"),
  active: boolean("active").default(true).notNull(),
});
