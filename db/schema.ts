import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // Kinde ID
  email: text("email").notNull(),
  name: text("name"),
  picture: text("picture"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const folders = sqliteTable("folders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const resumes = sqliteTable("resumes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  folderId: text("folder_id").notNull().references(() => folders.id),
  title: text("title").notNull(),
  content: text("content", { mode: "json" }).notNull(),
  template: text("template").notNull(),
  margins: text("margins", { mode: "json" }),
  linkSettings: text("link_settings", { mode: "json" }),
  avoidSectionBreaks: integer("avoid_section_breaks", { mode: "boolean" }),
  atsScore: integer("ats_score"),
  grammarScore: integer("grammar_score"),
  isTailored: integer("is_tailored", { mode: "boolean" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

export const customTemplates = sqliteTable("custom_templates", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  nodes: text("nodes", { mode: "json" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
