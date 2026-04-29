CREATE TABLE "custom_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"notes" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"status" varchar(20) DEFAULT 'processing' NOT NULL,
	"source" varchar(32) DEFAULT 'manual',
	"customer_name" text NOT NULL,
	"customer_email" text,
	"customer_phone" text,
	"customer_company" text,
	"shipping_address" text,
	"total" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"currency" varchar(8) DEFAULT 'USD' NOT NULL,
	"payment_method" text,
	"payment_received" boolean DEFAULT false NOT NULL,
	"customer_note" text,
	"internal_notes" text,
	"due_date" timestamp,
	"completed_at" timestamp,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "custom_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
ALTER TABLE "custom_order_items" ADD CONSTRAINT "custom_order_items_order_id_custom_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."custom_orders"("id") ON DELETE cascade ON UPDATE no action;