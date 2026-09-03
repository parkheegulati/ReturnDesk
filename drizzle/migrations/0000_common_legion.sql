CREATE SEQUENCE IF NOT EXISTS "request_reference_seq" START WITH 1 INCREMENT BY 1;--> statement-breakpoint
CREATE TYPE "public"."return_reason" AS ENUM('damaged', 'wrong_item', 'size_issue', 'not_as_described', 'changed_mind');--> statement-breakpoint
CREATE TYPE "public"."request_resolution" AS ENUM('refund', 'replacement', 'store_credit');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('open', 'in_review', 'approved', 'completed', 'rejected');--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(20) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"customer_contact" varchar(255) NOT NULL,
	"order_id" varchar(100) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"reason" "return_reason" NOT NULL,
	"status" "request_status" DEFAULT 'open' NOT NULL,
	"resolution" "request_resolution",
	"refund_amount" numeric(10, 2),
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "requests_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_requests_status" ON "requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_requests_reason" ON "requests" USING btree ("reason");--> statement-breakpoint
CREATE INDEX "idx_requests_order_id" ON "requests" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_requests_customer_name" ON "requests" USING btree ("customer_name");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_live_request_per_item" ON "requests" USING btree ("order_id","item_name") WHERE removed_at IS NULL AND status NOT IN ('rejected','completed');