CREATE TABLE "investigations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"mystery_id" uuid NOT NULL,
	"opened_evidence_ids" jsonb DEFAULT '[]' NOT NULL,
	"bookmarked_evidence_ids" jsonb DEFAULT '[]' NOT NULL,
	"investigation_notes" text DEFAULT '' NOT NULL,
	"selected_suspect_id" text,
	"submitted_at" timestamp,
	"is_completed" boolean DEFAULT false NOT NULL,
	"score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mysteries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"case_title" text NOT NULL,
	"category" text NOT NULL,
	"difficulty" text NOT NULL,
	"case_overview" jsonb NOT NULL,
	"suspects" jsonb NOT NULL,
	"timeline" jsonb NOT NULL,
	"evidence" jsonb NOT NULL,
	"solution" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_mystery_id_mysteries_id_fkey" FOREIGN KEY ("mystery_id") REFERENCES "mysteries"("id") ON DELETE CASCADE;