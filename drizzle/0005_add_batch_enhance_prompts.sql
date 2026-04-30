CREATE TABLE "batch_enhance_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"prompt" text NOT NULL,
	"icon" varchar(24) DEFAULT 'Sparkles' NOT NULL,
	"accent" varchar(16) DEFAULT 'amber' NOT NULL,
	"use_count" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
