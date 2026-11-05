import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS "payload";

   CREATE TYPE "payload"."_locales" AS ENUM('en', 'zh');
  CREATE TYPE "payload"."enum_stores_floor" AS ENUM('G', 'LOW', 'MID', '33', '33A', 'ALL', 'UP', 'HIGH', '63A');
  CREATE TYPE "payload"."enum_stores_category" AS ENUM('one', 'two', 'three', 'dualkey', 'family', 'wellness', 'rooftop');
  CREATE TYPE "payload"."enum_stores_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__stores_v_version_floor" AS ENUM('G', 'LOW', 'MID', '33', '33A', 'ALL', 'UP', 'HIGH', '63A');
  CREATE TYPE "payload"."enum__stores_v_version_category" AS ENUM('one', 'two', 'three', 'dualkey', 'family', 'wellness', 'rooftop');
  CREATE TYPE "payload"."enum__stores_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__stores_v_published_locale" AS ENUM('en', 'zh');
  CREATE TYPE "payload"."enum_events_category" AS ENUM('event', 'campaign', 'popup');
  CREATE TYPE "payload"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__events_v_version_category" AS ENUM('event', 'campaign', 'popup');
  CREATE TYPE "payload"."enum__events_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__events_v_published_locale" AS ENUM('en', 'zh');
  CREATE TYPE "payload"."enum_highlights_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__highlights_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__highlights_v_published_locale" AS ENUM('en', 'zh');
  CREATE TYPE "payload"."enum_notices_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__notices_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__notices_v_published_locale" AS ENUM('en', 'zh');
  CREATE TYPE "payload"."enum_facilities_icon" AS ENUM('atm', 'baby', 'stroller', 'carwash', 'parking', 'wc', 'wifi', 'alert', 'surau', 'wheel');
  CREATE TYPE "payload"."enum_facilities_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__facilities_v_version_icon" AS ENUM('atm', 'baby', 'stroller', 'carwash', 'parking', 'wc', 'wifi', 'alert', 'surau', 'wheel');
  CREATE TYPE "payload"."enum__facilities_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__facilities_v_published_locale" AS ENUM('en', 'zh');
  CREATE TYPE "payload"."enum_facts_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__facts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__facts_v_published_locale" AS ENUM('en', 'zh');
  CREATE TYPE "payload"."enum_entrances_kind" AS ENUM('main', 'mrt', 'bus', 'side', 'parking');
  CREATE TYPE "payload"."enum_entrances_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__entrances_v_version_kind" AS ENUM('main', 'mrt', 'bus', 'side', 'parking');
  CREATE TYPE "payload"."enum__entrances_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__entrances_v_published_locale" AS ENUM('en', 'zh');
  CREATE TYPE "payload"."enum_exits_kind" AS ENUM('exit', 'assembly');
  CREATE TYPE "payload"."enum_exits_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__exits_v_version_kind" AS ENUM('exit', 'assembly');
  CREATE TYPE "payload"."enum__exits_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__exits_v_published_locale" AS ENUM('en', 'zh');
  CREATE TYPE "payload"."enum_routes_mode" AS ENUM('walk', 'drive');
  CREATE TYPE "payload"."enum_routes_start" AS ENUM('jalan-ampang-north', 'jalan-ampang-south');
  CREATE TYPE "payload"."enum_routes_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__routes_v_version_mode" AS ENUM('walk', 'drive');
  CREATE TYPE "payload"."enum__routes_v_version_start" AS ENUM('jalan-ampang-north', 'jalan-ampang-south');
  CREATE TYPE "payload"."enum__routes_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__routes_v_published_locale" AS ENUM('en', 'zh');
  CREATE TYPE "payload"."enum_reports_kind" AS ENUM('error', 'slow');
  CREATE TYPE "payload"."enum_reports_device" AS ENUM('desktop', 'phone');
  CREATE TYPE "payload"."enum_site_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__site_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__site_v_published_locale" AS ENUM('en', 'zh');
  CREATE TABLE "payload"."stores" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"name" varchar,
  	"logo_id" integer,
  	"floor" "payload"."enum_stores_floor",
  	"unit" varchar,
  	"category" "payload"."enum_stores_category" DEFAULT 'one',
  	"featured" boolean,
  	"pin_x" numeric,
  	"pin_y" numeric,
  	"pin_estimated" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_stores_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."stores_locales" (
  	"desc" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_stores_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__order" varchar,
  	"version_name" varchar,
  	"version_logo_id" integer,
  	"version_floor" "payload"."enum__stores_v_version_floor",
  	"version_unit" varchar,
  	"version_category" "payload"."enum__stores_v_version_category" DEFAULT 'one',
  	"version_featured" boolean,
  	"version_pin_x" numeric,
  	"version_pin_y" numeric,
  	"version_pin_estimated" boolean,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__stores_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "payload"."enum__stores_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_stores_v_locales" (
  	"version_desc" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"category" "payload"."enum_events_category" DEFAULT 'event',
  	"image_id" integer,
  	"start" timestamp(3) with time zone,
  	"end" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_events_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."events_locales" (
  	"title" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__order" varchar,
  	"version_category" "payload"."enum__events_v_version_category" DEFAULT 'event',
  	"version_image_id" integer,
  	"version_start" timestamp(3) with time zone,
  	"version_end" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__events_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "payload"."enum__events_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_events_v_locales" (
  	"version_title" varchar,
  	"version_note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."highlights" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"image_id" integer,
  	"link" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_highlights_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."highlights_locales" (
  	"title" varchar,
  	"desc" varchar,
  	"subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_highlights_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__order" varchar,
  	"version_image_id" integer,
  	"version_link" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__highlights_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "payload"."enum__highlights_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_highlights_v_locales" (
  	"version_title" varchar,
  	"version_desc" varchar,
  	"version_subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."notices" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"date" timestamp(3) with time zone,
  	"link" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_notices_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."notices_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_notices_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__order" varchar,
  	"version_date" timestamp(3) with time zone,
  	"version_link" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__notices_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "payload"."enum__notices_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_notices_v_locales" (
  	"version_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."facilities" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"icon" "payload"."enum_facilities_icon",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_facilities_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."facilities_locales" (
  	"name" varchar,
  	"where" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_facilities_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__order" varchar,
  	"version_icon" "payload"."enum__facilities_v_version_icon",
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__facilities_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "payload"."enum__facilities_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_facilities_v_locales" (
  	"version_name" varchar,
  	"version_where" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."facts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_facts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."facts_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_facts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__order" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__facts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "payload"."enum__facts_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_facts_v_locales" (
  	"version_title" varchar,
  	"version_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."entrances" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"kind" "payload"."enum_entrances_kind",
  	"key" varchar,
  	"pos_x" numeric,
  	"pos_y" numeric,
  	"pos_z" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_entrances_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."entrances_locales" (
  	"name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_entrances_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__order" varchar,
  	"version_kind" "payload"."enum__entrances_v_version_kind",
  	"version_key" varchar,
  	"version_pos_x" numeric,
  	"version_pos_y" numeric,
  	"version_pos_z" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__entrances_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "payload"."enum__entrances_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_entrances_v_locales" (
  	"version_name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."exits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"kind" "payload"."enum_exits_kind" DEFAULT 'exit',
  	"pos_x" numeric,
  	"pos_y" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_exits_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."exits_locales" (
  	"name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_exits_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__order" varchar,
  	"version_kind" "payload"."enum__exits_v_version_kind" DEFAULT 'exit',
  	"version_pos_x" numeric,
  	"version_pos_y" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__exits_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "payload"."enum__exits_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_exits_v_locales" (
  	"version_name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."routes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"key" varchar,
  	"mode" "payload"."enum_routes_mode" DEFAULT 'walk',
  	"to_id" integer,
  	"start" "payload"."enum_routes_start",
  	"from_x" numeric,
  	"from_y" numeric,
  	"from_z" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_routes_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."routes_locales" (
  	"label" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_routes_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__order" varchar,
  	"version_key" varchar,
  	"version_mode" "payload"."enum__routes_v_version_mode" DEFAULT 'walk',
  	"version_to_id" integer,
  	"version_start" "payload"."enum__routes_v_version_start",
  	"version_from_x" numeric,
  	"version_from_y" numeric,
  	"version_from_z" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__routes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "payload"."enum__routes_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_routes_v_locales" (
  	"version_label" varchar,
  	"version_note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar
  );
  
  CREATE TABLE "payload"."media_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
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
  
  CREATE TABLE "payload"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stores_id" integer,
  	"events_id" integer,
  	"highlights_id" integer,
  	"notices_id" integer,
  	"facilities_id" integer,
  	"facts_id" integer,
  	"entrances_id" integer,
  	"exits_id" integer,
  	"routes_id" integer,
  	"media_id" integer,
  	"users_id" integer,
  	"reports_id" integer
  );
  
  CREATE TABLE "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."site" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar,
  	"map_url" varchar,
  	"instagram_handle" varchar,
  	"instagram_url" varchar,
  	"facebook_handle" varchar,
  	"facebook_url" varchar,
  	"_status" "payload"."enum_site_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."site_locales" (
  	"hours" varchar,
  	"address" varchar,
  	"mrt" varchar,
  	"car" varchar,
  	"instagram_text" varchar,
  	"facebook_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_site_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_email" varchar,
  	"version_map_url" varchar,
  	"version_instagram_handle" varchar,
  	"version_instagram_url" varchar,
  	"version_facebook_handle" varchar,
  	"version_facebook_url" varchar,
  	"version__status" "payload"."enum__site_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "payload"."enum__site_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_site_v_locales" (
  	"version_hours" varchar,
  	"version_address" varchar,
  	"version_mrt" varchar,
  	"version_car" varchar,
  	"version_instagram_text" varchar,
  	"version_facebook_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."seo" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"og_image_id" integer,
  	"site_url" varchar DEFAULT 'https://clouthaus-malaysia.vercel.app',
  	"noindex" boolean DEFAULT true,
  	"ga_id" varchar,
  	"gsc_verification" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."seo_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload"."stores" ADD CONSTRAINT "stores_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."stores_locales" ADD CONSTRAINT "stores_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."stores"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_stores_v" ADD CONSTRAINT "_stores_v_parent_id_stores_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."stores"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_stores_v" ADD CONSTRAINT "_stores_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_stores_v_locales" ADD CONSTRAINT "_stores_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_stores_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."events" ADD CONSTRAINT "events_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."events_locales" ADD CONSTRAINT "events_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_events_v" ADD CONSTRAINT "_events_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_events_v_locales" ADD CONSTRAINT "_events_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."highlights" ADD CONSTRAINT "highlights_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."highlights_locales" ADD CONSTRAINT "highlights_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_highlights_v" ADD CONSTRAINT "_highlights_v_parent_id_highlights_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."highlights"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_highlights_v" ADD CONSTRAINT "_highlights_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_highlights_v_locales" ADD CONSTRAINT "_highlights_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_highlights_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."notices_locales" ADD CONSTRAINT "notices_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."notices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_notices_v" ADD CONSTRAINT "_notices_v_parent_id_notices_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."notices"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_notices_v_locales" ADD CONSTRAINT "_notices_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_notices_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."facilities_locales" ADD CONSTRAINT "facilities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."facilities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_facilities_v" ADD CONSTRAINT "_facilities_v_parent_id_facilities_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."facilities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_facilities_v_locales" ADD CONSTRAINT "_facilities_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_facilities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."facts_locales" ADD CONSTRAINT "facts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."facts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_facts_v" ADD CONSTRAINT "_facts_v_parent_id_facts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."facts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_facts_v_locales" ADD CONSTRAINT "_facts_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_facts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."entrances_locales" ADD CONSTRAINT "entrances_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."entrances"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_entrances_v" ADD CONSTRAINT "_entrances_v_parent_id_entrances_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."entrances"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_entrances_v_locales" ADD CONSTRAINT "_entrances_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_entrances_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."exits_locales" ADD CONSTRAINT "exits_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."exits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_exits_v" ADD CONSTRAINT "_exits_v_parent_id_exits_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."exits"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_exits_v_locales" ADD CONSTRAINT "_exits_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_exits_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."routes" ADD CONSTRAINT "routes_to_id_entrances_id_fk" FOREIGN KEY ("to_id") REFERENCES "payload"."entrances"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."routes_locales" ADD CONSTRAINT "routes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."routes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_routes_v" ADD CONSTRAINT "_routes_v_parent_id_routes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."routes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_routes_v" ADD CONSTRAINT "_routes_v_version_to_id_entrances_id_fk" FOREIGN KEY ("version_to_id") REFERENCES "payload"."entrances"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_routes_v_locales" ADD CONSTRAINT "_routes_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_routes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stores_fk" FOREIGN KEY ("stores_id") REFERENCES "payload"."stores"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "payload"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_highlights_fk" FOREIGN KEY ("highlights_id") REFERENCES "payload"."highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notices_fk" FOREIGN KEY ("notices_id") REFERENCES "payload"."notices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_facilities_fk" FOREIGN KEY ("facilities_id") REFERENCES "payload"."facilities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_facts_fk" FOREIGN KEY ("facts_id") REFERENCES "payload"."facts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_entrances_fk" FOREIGN KEY ("entrances_id") REFERENCES "payload"."entrances"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exits_fk" FOREIGN KEY ("exits_id") REFERENCES "payload"."exits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_routes_fk" FOREIGN KEY ("routes_id") REFERENCES "payload"."routes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reports_fk" FOREIGN KEY ("reports_id") REFERENCES "payload"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_locales" ADD CONSTRAINT "site_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_site_v_locales" ADD CONSTRAINT "_site_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_site_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."seo" ADD CONSTRAINT "seo_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."seo_locales" ADD CONSTRAINT "seo_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."seo"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "stores__order_idx" ON "payload"."stores" USING btree ("_order");
  CREATE INDEX "stores_logo_idx" ON "payload"."stores" USING btree ("logo_id");
  CREATE INDEX "stores_updated_at_idx" ON "payload"."stores" USING btree ("updated_at");
  CREATE INDEX "stores_created_at_idx" ON "payload"."stores" USING btree ("created_at");
  CREATE INDEX "stores__status_idx" ON "payload"."stores" USING btree ("_status");
  CREATE UNIQUE INDEX "stores_locales_locale_parent_id_unique" ON "payload"."stores_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "stores_locales_parent_id_idx" ON "payload"."stores_locales" USING btree ("_parent_id");
  CREATE INDEX "_stores_v_parent_idx" ON "payload"."_stores_v" USING btree ("parent_id");
  CREATE INDEX "_stores_v_version_version__order_idx" ON "payload"."_stores_v" USING btree ("version__order");
  CREATE INDEX "_stores_v_version_version_logo_idx" ON "payload"."_stores_v" USING btree ("version_logo_id");
  CREATE INDEX "_stores_v_version_version_updated_at_idx" ON "payload"."_stores_v" USING btree ("version_updated_at");
  CREATE INDEX "_stores_v_version_version_created_at_idx" ON "payload"."_stores_v" USING btree ("version_created_at");
  CREATE INDEX "_stores_v_version_version__status_idx" ON "payload"."_stores_v" USING btree ("version__status");
  CREATE INDEX "_stores_v_created_at_idx" ON "payload"."_stores_v" USING btree ("created_at");
  CREATE INDEX "_stores_v_updated_at_idx" ON "payload"."_stores_v" USING btree ("updated_at");
  CREATE INDEX "_stores_v_snapshot_idx" ON "payload"."_stores_v" USING btree ("snapshot");
  CREATE INDEX "_stores_v_published_locale_idx" ON "payload"."_stores_v" USING btree ("published_locale");
  CREATE INDEX "_stores_v_latest_idx" ON "payload"."_stores_v" USING btree ("latest");
  CREATE INDEX "_stores_v_autosave_idx" ON "payload"."_stores_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_stores_v_locales_locale_parent_id_unique" ON "payload"."_stores_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_stores_v_locales_parent_id_idx" ON "payload"."_stores_v_locales" USING btree ("_parent_id");
  CREATE INDEX "events__order_idx" ON "payload"."events" USING btree ("_order");
  CREATE INDEX "events_image_idx" ON "payload"."events" USING btree ("image_id");
  CREATE INDEX "events_updated_at_idx" ON "payload"."events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "payload"."events" USING btree ("created_at");
  CREATE INDEX "events__status_idx" ON "payload"."events" USING btree ("_status");
  CREATE UNIQUE INDEX "events_locales_locale_parent_id_unique" ON "payload"."events_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "events_locales_parent_id_idx" ON "payload"."events_locales" USING btree ("_parent_id");
  CREATE INDEX "_events_v_parent_idx" ON "payload"."_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_version__order_idx" ON "payload"."_events_v" USING btree ("version__order");
  CREATE INDEX "_events_v_version_version_image_idx" ON "payload"."_events_v" USING btree ("version_image_id");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "payload"."_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "payload"."_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_version_version__status_idx" ON "payload"."_events_v" USING btree ("version__status");
  CREATE INDEX "_events_v_created_at_idx" ON "payload"."_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "payload"."_events_v" USING btree ("updated_at");
  CREATE INDEX "_events_v_snapshot_idx" ON "payload"."_events_v" USING btree ("snapshot");
  CREATE INDEX "_events_v_published_locale_idx" ON "payload"."_events_v" USING btree ("published_locale");
  CREATE INDEX "_events_v_latest_idx" ON "payload"."_events_v" USING btree ("latest");
  CREATE INDEX "_events_v_autosave_idx" ON "payload"."_events_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_events_v_locales_locale_parent_id_unique" ON "payload"."_events_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_events_v_locales_parent_id_idx" ON "payload"."_events_v_locales" USING btree ("_parent_id");
  CREATE INDEX "highlights__order_idx" ON "payload"."highlights" USING btree ("_order");
  CREATE INDEX "highlights_image_idx" ON "payload"."highlights" USING btree ("image_id");
  CREATE INDEX "highlights_updated_at_idx" ON "payload"."highlights" USING btree ("updated_at");
  CREATE INDEX "highlights_created_at_idx" ON "payload"."highlights" USING btree ("created_at");
  CREATE INDEX "highlights__status_idx" ON "payload"."highlights" USING btree ("_status");
  CREATE UNIQUE INDEX "highlights_locales_locale_parent_id_unique" ON "payload"."highlights_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "highlights_locales_parent_id_idx" ON "payload"."highlights_locales" USING btree ("_parent_id");
  CREATE INDEX "_highlights_v_parent_idx" ON "payload"."_highlights_v" USING btree ("parent_id");
  CREATE INDEX "_highlights_v_version_version__order_idx" ON "payload"."_highlights_v" USING btree ("version__order");
  CREATE INDEX "_highlights_v_version_version_image_idx" ON "payload"."_highlights_v" USING btree ("version_image_id");
  CREATE INDEX "_highlights_v_version_version_updated_at_idx" ON "payload"."_highlights_v" USING btree ("version_updated_at");
  CREATE INDEX "_highlights_v_version_version_created_at_idx" ON "payload"."_highlights_v" USING btree ("version_created_at");
  CREATE INDEX "_highlights_v_version_version__status_idx" ON "payload"."_highlights_v" USING btree ("version__status");
  CREATE INDEX "_highlights_v_created_at_idx" ON "payload"."_highlights_v" USING btree ("created_at");
  CREATE INDEX "_highlights_v_updated_at_idx" ON "payload"."_highlights_v" USING btree ("updated_at");
  CREATE INDEX "_highlights_v_snapshot_idx" ON "payload"."_highlights_v" USING btree ("snapshot");
  CREATE INDEX "_highlights_v_published_locale_idx" ON "payload"."_highlights_v" USING btree ("published_locale");
  CREATE INDEX "_highlights_v_latest_idx" ON "payload"."_highlights_v" USING btree ("latest");
  CREATE INDEX "_highlights_v_autosave_idx" ON "payload"."_highlights_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_highlights_v_locales_locale_parent_id_unique" ON "payload"."_highlights_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_highlights_v_locales_parent_id_idx" ON "payload"."_highlights_v_locales" USING btree ("_parent_id");
  CREATE INDEX "notices__order_idx" ON "payload"."notices" USING btree ("_order");
  CREATE INDEX "notices_updated_at_idx" ON "payload"."notices" USING btree ("updated_at");
  CREATE INDEX "notices_created_at_idx" ON "payload"."notices" USING btree ("created_at");
  CREATE INDEX "notices__status_idx" ON "payload"."notices" USING btree ("_status");
  CREATE UNIQUE INDEX "notices_locales_locale_parent_id_unique" ON "payload"."notices_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "notices_locales_parent_id_idx" ON "payload"."notices_locales" USING btree ("_parent_id");
  CREATE INDEX "_notices_v_parent_idx" ON "payload"."_notices_v" USING btree ("parent_id");
  CREATE INDEX "_notices_v_version_version__order_idx" ON "payload"."_notices_v" USING btree ("version__order");
  CREATE INDEX "_notices_v_version_version_updated_at_idx" ON "payload"."_notices_v" USING btree ("version_updated_at");
  CREATE INDEX "_notices_v_version_version_created_at_idx" ON "payload"."_notices_v" USING btree ("version_created_at");
  CREATE INDEX "_notices_v_version_version__status_idx" ON "payload"."_notices_v" USING btree ("version__status");
  CREATE INDEX "_notices_v_created_at_idx" ON "payload"."_notices_v" USING btree ("created_at");
  CREATE INDEX "_notices_v_updated_at_idx" ON "payload"."_notices_v" USING btree ("updated_at");
  CREATE INDEX "_notices_v_snapshot_idx" ON "payload"."_notices_v" USING btree ("snapshot");
  CREATE INDEX "_notices_v_published_locale_idx" ON "payload"."_notices_v" USING btree ("published_locale");
  CREATE INDEX "_notices_v_latest_idx" ON "payload"."_notices_v" USING btree ("latest");
  CREATE INDEX "_notices_v_autosave_idx" ON "payload"."_notices_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_notices_v_locales_locale_parent_id_unique" ON "payload"."_notices_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_notices_v_locales_parent_id_idx" ON "payload"."_notices_v_locales" USING btree ("_parent_id");
  CREATE INDEX "facilities__order_idx" ON "payload"."facilities" USING btree ("_order");
  CREATE INDEX "facilities_updated_at_idx" ON "payload"."facilities" USING btree ("updated_at");
  CREATE INDEX "facilities_created_at_idx" ON "payload"."facilities" USING btree ("created_at");
  CREATE INDEX "facilities__status_idx" ON "payload"."facilities" USING btree ("_status");
  CREATE UNIQUE INDEX "facilities_locales_locale_parent_id_unique" ON "payload"."facilities_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "facilities_locales_parent_id_idx" ON "payload"."facilities_locales" USING btree ("_parent_id");
  CREATE INDEX "_facilities_v_parent_idx" ON "payload"."_facilities_v" USING btree ("parent_id");
  CREATE INDEX "_facilities_v_version_version__order_idx" ON "payload"."_facilities_v" USING btree ("version__order");
  CREATE INDEX "_facilities_v_version_version_updated_at_idx" ON "payload"."_facilities_v" USING btree ("version_updated_at");
  CREATE INDEX "_facilities_v_version_version_created_at_idx" ON "payload"."_facilities_v" USING btree ("version_created_at");
  CREATE INDEX "_facilities_v_version_version__status_idx" ON "payload"."_facilities_v" USING btree ("version__status");
  CREATE INDEX "_facilities_v_created_at_idx" ON "payload"."_facilities_v" USING btree ("created_at");
  CREATE INDEX "_facilities_v_updated_at_idx" ON "payload"."_facilities_v" USING btree ("updated_at");
  CREATE INDEX "_facilities_v_snapshot_idx" ON "payload"."_facilities_v" USING btree ("snapshot");
  CREATE INDEX "_facilities_v_published_locale_idx" ON "payload"."_facilities_v" USING btree ("published_locale");
  CREATE INDEX "_facilities_v_latest_idx" ON "payload"."_facilities_v" USING btree ("latest");
  CREATE INDEX "_facilities_v_autosave_idx" ON "payload"."_facilities_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_facilities_v_locales_locale_parent_id_unique" ON "payload"."_facilities_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_facilities_v_locales_parent_id_idx" ON "payload"."_facilities_v_locales" USING btree ("_parent_id");
  CREATE INDEX "facts__order_idx" ON "payload"."facts" USING btree ("_order");
  CREATE INDEX "facts_updated_at_idx" ON "payload"."facts" USING btree ("updated_at");
  CREATE INDEX "facts_created_at_idx" ON "payload"."facts" USING btree ("created_at");
  CREATE INDEX "facts__status_idx" ON "payload"."facts" USING btree ("_status");
  CREATE UNIQUE INDEX "facts_locales_locale_parent_id_unique" ON "payload"."facts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "facts_locales_parent_id_idx" ON "payload"."facts_locales" USING btree ("_parent_id");
  CREATE INDEX "_facts_v_parent_idx" ON "payload"."_facts_v" USING btree ("parent_id");
  CREATE INDEX "_facts_v_version_version__order_idx" ON "payload"."_facts_v" USING btree ("version__order");
  CREATE INDEX "_facts_v_version_version_updated_at_idx" ON "payload"."_facts_v" USING btree ("version_updated_at");
  CREATE INDEX "_facts_v_version_version_created_at_idx" ON "payload"."_facts_v" USING btree ("version_created_at");
  CREATE INDEX "_facts_v_version_version__status_idx" ON "payload"."_facts_v" USING btree ("version__status");
  CREATE INDEX "_facts_v_created_at_idx" ON "payload"."_facts_v" USING btree ("created_at");
  CREATE INDEX "_facts_v_updated_at_idx" ON "payload"."_facts_v" USING btree ("updated_at");
  CREATE INDEX "_facts_v_snapshot_idx" ON "payload"."_facts_v" USING btree ("snapshot");
  CREATE INDEX "_facts_v_published_locale_idx" ON "payload"."_facts_v" USING btree ("published_locale");
  CREATE INDEX "_facts_v_latest_idx" ON "payload"."_facts_v" USING btree ("latest");
  CREATE INDEX "_facts_v_autosave_idx" ON "payload"."_facts_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_facts_v_locales_locale_parent_id_unique" ON "payload"."_facts_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_facts_v_locales_parent_id_idx" ON "payload"."_facts_v_locales" USING btree ("_parent_id");
  CREATE INDEX "entrances__order_idx" ON "payload"."entrances" USING btree ("_order");
  CREATE UNIQUE INDEX "entrances_key_idx" ON "payload"."entrances" USING btree ("key");
  CREATE INDEX "entrances_updated_at_idx" ON "payload"."entrances" USING btree ("updated_at");
  CREATE INDEX "entrances_created_at_idx" ON "payload"."entrances" USING btree ("created_at");
  CREATE INDEX "entrances__status_idx" ON "payload"."entrances" USING btree ("_status");
  CREATE UNIQUE INDEX "entrances_locales_locale_parent_id_unique" ON "payload"."entrances_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "entrances_locales_parent_id_idx" ON "payload"."entrances_locales" USING btree ("_parent_id");
  CREATE INDEX "_entrances_v_parent_idx" ON "payload"."_entrances_v" USING btree ("parent_id");
  CREATE INDEX "_entrances_v_version_version__order_idx" ON "payload"."_entrances_v" USING btree ("version__order");
  CREATE INDEX "_entrances_v_version_version_key_idx" ON "payload"."_entrances_v" USING btree ("version_key");
  CREATE INDEX "_entrances_v_version_version_updated_at_idx" ON "payload"."_entrances_v" USING btree ("version_updated_at");
  CREATE INDEX "_entrances_v_version_version_created_at_idx" ON "payload"."_entrances_v" USING btree ("version_created_at");
  CREATE INDEX "_entrances_v_version_version__status_idx" ON "payload"."_entrances_v" USING btree ("version__status");
  CREATE INDEX "_entrances_v_created_at_idx" ON "payload"."_entrances_v" USING btree ("created_at");
  CREATE INDEX "_entrances_v_updated_at_idx" ON "payload"."_entrances_v" USING btree ("updated_at");
  CREATE INDEX "_entrances_v_snapshot_idx" ON "payload"."_entrances_v" USING btree ("snapshot");
  CREATE INDEX "_entrances_v_published_locale_idx" ON "payload"."_entrances_v" USING btree ("published_locale");
  CREATE INDEX "_entrances_v_latest_idx" ON "payload"."_entrances_v" USING btree ("latest");
  CREATE INDEX "_entrances_v_autosave_idx" ON "payload"."_entrances_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_entrances_v_locales_locale_parent_id_unique" ON "payload"."_entrances_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_entrances_v_locales_parent_id_idx" ON "payload"."_entrances_v_locales" USING btree ("_parent_id");
  CREATE INDEX "exits__order_idx" ON "payload"."exits" USING btree ("_order");
  CREATE INDEX "exits_updated_at_idx" ON "payload"."exits" USING btree ("updated_at");
  CREATE INDEX "exits_created_at_idx" ON "payload"."exits" USING btree ("created_at");
  CREATE INDEX "exits__status_idx" ON "payload"."exits" USING btree ("_status");
  CREATE UNIQUE INDEX "exits_locales_locale_parent_id_unique" ON "payload"."exits_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "exits_locales_parent_id_idx" ON "payload"."exits_locales" USING btree ("_parent_id");
  CREATE INDEX "_exits_v_parent_idx" ON "payload"."_exits_v" USING btree ("parent_id");
  CREATE INDEX "_exits_v_version_version__order_idx" ON "payload"."_exits_v" USING btree ("version__order");
  CREATE INDEX "_exits_v_version_version_updated_at_idx" ON "payload"."_exits_v" USING btree ("version_updated_at");
  CREATE INDEX "_exits_v_version_version_created_at_idx" ON "payload"."_exits_v" USING btree ("version_created_at");
  CREATE INDEX "_exits_v_version_version__status_idx" ON "payload"."_exits_v" USING btree ("version__status");
  CREATE INDEX "_exits_v_created_at_idx" ON "payload"."_exits_v" USING btree ("created_at");
  CREATE INDEX "_exits_v_updated_at_idx" ON "payload"."_exits_v" USING btree ("updated_at");
  CREATE INDEX "_exits_v_snapshot_idx" ON "payload"."_exits_v" USING btree ("snapshot");
  CREATE INDEX "_exits_v_published_locale_idx" ON "payload"."_exits_v" USING btree ("published_locale");
  CREATE INDEX "_exits_v_latest_idx" ON "payload"."_exits_v" USING btree ("latest");
  CREATE INDEX "_exits_v_autosave_idx" ON "payload"."_exits_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_exits_v_locales_locale_parent_id_unique" ON "payload"."_exits_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_exits_v_locales_parent_id_idx" ON "payload"."_exits_v_locales" USING btree ("_parent_id");
  CREATE INDEX "routes__order_idx" ON "payload"."routes" USING btree ("_order");
  CREATE UNIQUE INDEX "routes_key_idx" ON "payload"."routes" USING btree ("key");
  CREATE INDEX "routes_to_idx" ON "payload"."routes" USING btree ("to_id");
  CREATE INDEX "routes_updated_at_idx" ON "payload"."routes" USING btree ("updated_at");
  CREATE INDEX "routes_created_at_idx" ON "payload"."routes" USING btree ("created_at");
  CREATE INDEX "routes__status_idx" ON "payload"."routes" USING btree ("_status");
  CREATE UNIQUE INDEX "routes_locales_locale_parent_id_unique" ON "payload"."routes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "routes_locales_parent_id_idx" ON "payload"."routes_locales" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_parent_idx" ON "payload"."_routes_v" USING btree ("parent_id");
  CREATE INDEX "_routes_v_version_version__order_idx" ON "payload"."_routes_v" USING btree ("version__order");
  CREATE INDEX "_routes_v_version_version_key_idx" ON "payload"."_routes_v" USING btree ("version_key");
  CREATE INDEX "_routes_v_version_version_to_idx" ON "payload"."_routes_v" USING btree ("version_to_id");
  CREATE INDEX "_routes_v_version_version_updated_at_idx" ON "payload"."_routes_v" USING btree ("version_updated_at");
  CREATE INDEX "_routes_v_version_version_created_at_idx" ON "payload"."_routes_v" USING btree ("version_created_at");
  CREATE INDEX "_routes_v_version_version__status_idx" ON "payload"."_routes_v" USING btree ("version__status");
  CREATE INDEX "_routes_v_created_at_idx" ON "payload"."_routes_v" USING btree ("created_at");
  CREATE INDEX "_routes_v_updated_at_idx" ON "payload"."_routes_v" USING btree ("updated_at");
  CREATE INDEX "_routes_v_snapshot_idx" ON "payload"."_routes_v" USING btree ("snapshot");
  CREATE INDEX "_routes_v_published_locale_idx" ON "payload"."_routes_v" USING btree ("published_locale");
  CREATE INDEX "_routes_v_latest_idx" ON "payload"."_routes_v" USING btree ("latest");
  CREATE INDEX "_routes_v_autosave_idx" ON "payload"."_routes_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_routes_v_locales_locale_parent_id_unique" ON "payload"."_routes_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_routes_v_locales_parent_id_idx" ON "payload"."_routes_v_locales" USING btree ("_parent_id");
  CREATE INDEX "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "payload"."media" USING btree ("sizes_thumb_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "payload"."media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_locales_parent_id_idx" ON "payload"."media_locales" USING btree ("_parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE INDEX "reports_key_idx" ON "payload"."reports" USING btree ("key");
  CREATE INDEX "reports_updated_at_idx" ON "payload"."reports" USING btree ("updated_at");
  CREATE INDEX "reports_created_at_idx" ON "payload"."reports" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_stores_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("stores_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_highlights_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("highlights_id");
  CREATE INDEX "payload_locked_documents_rels_notices_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("notices_id");
  CREATE INDEX "payload_locked_documents_rels_facilities_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("facilities_id");
  CREATE INDEX "payload_locked_documents_rels_facts_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("facts_id");
  CREATE INDEX "payload_locked_documents_rels_entrances_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("entrances_id");
  CREATE INDEX "payload_locked_documents_rels_exits_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("exits_id");
  CREATE INDEX "payload_locked_documents_rels_routes_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("routes_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_reports_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("reports_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "site__status_idx" ON "payload"."site" USING btree ("_status");
  CREATE UNIQUE INDEX "site_locales_locale_parent_id_unique" ON "payload"."site_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_locales_parent_id_idx" ON "payload"."site_locales" USING btree ("_parent_id");
  CREATE INDEX "_site_v_version_version__status_idx" ON "payload"."_site_v" USING btree ("version__status");
  CREATE INDEX "_site_v_created_at_idx" ON "payload"."_site_v" USING btree ("created_at");
  CREATE INDEX "_site_v_updated_at_idx" ON "payload"."_site_v" USING btree ("updated_at");
  CREATE INDEX "_site_v_snapshot_idx" ON "payload"."_site_v" USING btree ("snapshot");
  CREATE INDEX "_site_v_published_locale_idx" ON "payload"."_site_v" USING btree ("published_locale");
  CREATE INDEX "_site_v_latest_idx" ON "payload"."_site_v" USING btree ("latest");
  CREATE INDEX "_site_v_autosave_idx" ON "payload"."_site_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_site_v_locales_locale_parent_id_unique" ON "payload"."_site_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_site_v_locales_parent_id_idx" ON "payload"."_site_v_locales" USING btree ("_parent_id");
  CREATE INDEX "seo_og_image_idx" ON "payload"."seo" USING btree ("og_image_id");
  CREATE UNIQUE INDEX "seo_locales_locale_parent_id_unique" ON "payload"."seo_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "seo_locales_parent_id_idx" ON "payload"."seo_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."stores" CASCADE;
  DROP TABLE "payload"."stores_locales" CASCADE;
  DROP TABLE "payload"."_stores_v" CASCADE;
  DROP TABLE "payload"."_stores_v_locales" CASCADE;
  DROP TABLE "payload"."events" CASCADE;
  DROP TABLE "payload"."events_locales" CASCADE;
  DROP TABLE "payload"."_events_v" CASCADE;
  DROP TABLE "payload"."_events_v_locales" CASCADE;
  DROP TABLE "payload"."highlights" CASCADE;
  DROP TABLE "payload"."highlights_locales" CASCADE;
  DROP TABLE "payload"."_highlights_v" CASCADE;
  DROP TABLE "payload"."_highlights_v_locales" CASCADE;
  DROP TABLE "payload"."notices" CASCADE;
  DROP TABLE "payload"."notices_locales" CASCADE;
  DROP TABLE "payload"."_notices_v" CASCADE;
  DROP TABLE "payload"."_notices_v_locales" CASCADE;
  DROP TABLE "payload"."facilities" CASCADE;
  DROP TABLE "payload"."facilities_locales" CASCADE;
  DROP TABLE "payload"."_facilities_v" CASCADE;
  DROP TABLE "payload"."_facilities_v_locales" CASCADE;
  DROP TABLE "payload"."facts" CASCADE;
  DROP TABLE "payload"."facts_locales" CASCADE;
  DROP TABLE "payload"."_facts_v" CASCADE;
  DROP TABLE "payload"."_facts_v_locales" CASCADE;
  DROP TABLE "payload"."entrances" CASCADE;
  DROP TABLE "payload"."entrances_locales" CASCADE;
  DROP TABLE "payload"."_entrances_v" CASCADE;
  DROP TABLE "payload"."_entrances_v_locales" CASCADE;
  DROP TABLE "payload"."exits" CASCADE;
  DROP TABLE "payload"."exits_locales" CASCADE;
  DROP TABLE "payload"."_exits_v" CASCADE;
  DROP TABLE "payload"."_exits_v_locales" CASCADE;
  DROP TABLE "payload"."routes" CASCADE;
  DROP TABLE "payload"."routes_locales" CASCADE;
  DROP TABLE "payload"."_routes_v" CASCADE;
  DROP TABLE "payload"."_routes_v_locales" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."media_locales" CASCADE;
  DROP TABLE "payload"."users_sessions" CASCADE;
  DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."reports" CASCADE;
  DROP TABLE "payload"."payload_kv" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TABLE "payload"."site" CASCADE;
  DROP TABLE "payload"."site_locales" CASCADE;
  DROP TABLE "payload"."_site_v" CASCADE;
  DROP TABLE "payload"."_site_v_locales" CASCADE;
  DROP TABLE "payload"."seo" CASCADE;
  DROP TABLE "payload"."seo_locales" CASCADE;
  DROP TYPE "payload"."_locales";
  DROP TYPE "payload"."enum_stores_floor";
  DROP TYPE "payload"."enum_stores_category";
  DROP TYPE "payload"."enum_stores_status";
  DROP TYPE "payload"."enum__stores_v_version_floor";
  DROP TYPE "payload"."enum__stores_v_version_category";
  DROP TYPE "payload"."enum__stores_v_version_status";
  DROP TYPE "payload"."enum__stores_v_published_locale";
  DROP TYPE "payload"."enum_events_category";
  DROP TYPE "payload"."enum_events_status";
  DROP TYPE "payload"."enum__events_v_version_category";
  DROP TYPE "payload"."enum__events_v_version_status";
  DROP TYPE "payload"."enum__events_v_published_locale";
  DROP TYPE "payload"."enum_highlights_status";
  DROP TYPE "payload"."enum__highlights_v_version_status";
  DROP TYPE "payload"."enum__highlights_v_published_locale";
  DROP TYPE "payload"."enum_notices_status";
  DROP TYPE "payload"."enum__notices_v_version_status";
  DROP TYPE "payload"."enum__notices_v_published_locale";
  DROP TYPE "payload"."enum_facilities_icon";
  DROP TYPE "payload"."enum_facilities_status";
  DROP TYPE "payload"."enum__facilities_v_version_icon";
  DROP TYPE "payload"."enum__facilities_v_version_status";
  DROP TYPE "payload"."enum__facilities_v_published_locale";
  DROP TYPE "payload"."enum_facts_status";
  DROP TYPE "payload"."enum__facts_v_version_status";
  DROP TYPE "payload"."enum__facts_v_published_locale";
  DROP TYPE "payload"."enum_entrances_kind";
  DROP TYPE "payload"."enum_entrances_status";
  DROP TYPE "payload"."enum__entrances_v_version_kind";
  DROP TYPE "payload"."enum__entrances_v_version_status";
  DROP TYPE "payload"."enum__entrances_v_published_locale";
  DROP TYPE "payload"."enum_exits_kind";
  DROP TYPE "payload"."enum_exits_status";
  DROP TYPE "payload"."enum__exits_v_version_kind";
  DROP TYPE "payload"."enum__exits_v_version_status";
  DROP TYPE "payload"."enum__exits_v_published_locale";
  DROP TYPE "payload"."enum_routes_mode";
  DROP TYPE "payload"."enum_routes_start";
  DROP TYPE "payload"."enum_routes_status";
  DROP TYPE "payload"."enum__routes_v_version_mode";
  DROP TYPE "payload"."enum__routes_v_version_start";
  DROP TYPE "payload"."enum__routes_v_version_status";
  DROP TYPE "payload"."enum__routes_v_published_locale";
  DROP TYPE "payload"."enum_reports_kind";
  DROP TYPE "payload"."enum_reports_device";
  DROP TYPE "payload"."enum_site_status";
  DROP TYPE "payload"."enum__site_v_version_status";
  DROP TYPE "payload"."enum__site_v_published_locale";`)
}
