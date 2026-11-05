import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_reports_kind" AS ENUM('error', 'slow');
  CREATE TYPE "payload"."enum_reports_device" AS ENUM('desktop', 'phone');
  CREATE TABLE "payload"."reports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "payload"."enum_reports_kind" NOT NULL,
  	"message" varchar NOT NULL,
  	"source" varchar,
  	"device" "payload"."enum_reports_device",
  	"page" varchar,
  	"user_agent" varchar,
  	"count" numeric DEFAULT 1,
  	"last_seen" timestamp(3) with time zone,
  	"key" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "reports_id" integer;
  CREATE INDEX "reports_key_idx" ON "payload"."reports" USING btree ("key");
  CREATE INDEX "reports_updated_at_idx" ON "payload"."reports" USING btree ("updated_at");
  CREATE INDEX "reports_created_at_idx" ON "payload"."reports" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reports_fk" FOREIGN KEY ("reports_id") REFERENCES "payload"."reports"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_reports_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("reports_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."reports" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."reports" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reports_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_reports_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "reports_id";
  DROP TYPE "payload"."enum_reports_kind";
  DROP TYPE "payload"."enum_reports_device";`)
}
