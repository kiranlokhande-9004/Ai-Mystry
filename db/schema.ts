import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const mysteries = pgTable("mysteries", {
  id: uuid().primaryKey().defaultRandom(),
  caseTitle: text("case_title").notNull(),
  category: text().notNull(),
  difficulty: text().notNull(),
  caseOverview: jsonb("case_overview").notNull(),
  suspects: jsonb().$type<Array<Record<string, any>>>().notNull(),
  timeline: jsonb().$type<Array<Record<string, any>>>().notNull(),
  evidence: jsonb().$type<Array<Record<string, any>>>().notNull(),
  solution: jsonb().$type<Record<string, any>>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const investigations = pgTable("investigations", {
  id: uuid().primaryKey().defaultRandom(),
  mysteryId: uuid("mystery_id").notNull().references(() => mysteries.id, { onDelete: "cascade" }),
  openedEvidenceIds: jsonb("opened_evidence_ids").$type<string[]>().notNull().default([]),
  bookmarkedEvidenceIds: jsonb("bookmarked_evidence_ids").$type<string[]>().notNull().default([]),
  investigationNotes: text("investigation_notes").notNull().default(""),
  selectedSuspectId: text("selected_suspect_id"),
  submittedAt: timestamp("submitted_at"),
  isCompleted: boolean("is_completed").notNull().default(false),
  score: integer(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
