-- Schéma "Cendres et Vapeur" — source de vérité de la base.
-- PK auto-incrémentées (IDENTITY), timestamps de création par défaut,
-- politiques ON DELETE explicites.
-- Application atomique : tout réussit ou rien (évite une base à moitié initialisée).

BEGIN;

CREATE TABLE "roles" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "name" varchar UNIQUE NOT NULL
);

CREATE TABLE "users" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "username" varchar UNIQUE NOT NULL,
  "email" varchar UNIQUE NOT NULL,
  "password_hash" varchar,
  "role_id" integer NOT NULL,
  "oauth_provider" varchar,
  "oauth_provider_id" varchar,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "two_factor_codes" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_id" integer NOT NULL,
  "code_hash" varchar NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used" boolean DEFAULT false
);

CREATE TABLE "categories" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "name" varchar UNIQUE NOT NULL
);

CREATE TABLE "products" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "category_id" integer NOT NULL,
  "name" varchar NOT NULL,
  "description" text,
  "url" varchar(2048),
  "stock" integer NOT NULL DEFAULT 0,
  "price" decimal NOT NULL,
  "previous_price" decimal,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "price_history" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "product_id" integer NOT NULL,
  "price" decimal NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "product_votes" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "carts" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_id" integer UNIQUE NOT NULL
);

CREATE TABLE "cart_items" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "cart_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1
);

CREATE TABLE "discount_codes" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "code" varchar UNIQUE NOT NULL,
  "percentage" decimal NOT NULL,
  "active" boolean DEFAULT true
);

CREATE TABLE "orders" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_id" integer NOT NULL,
  "discount_code_id" integer,
  "total_amount" decimal NOT NULL,
  "status" varchar NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "order_items" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "order_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "quantity" integer NOT NULL,
  "unit_price" decimal NOT NULL
);

CREATE TABLE "colony_events" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "title" varchar NOT NULL,
  "description" text,
  "event_date" date NOT NULL,
  "priority" varchar NOT NULL
);

CREATE TABLE "shift_notes" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_id" integer NOT NULL,
  "note_date" date NOT NULL,
  "shift" varchar NOT NULL,
  "content" text
);

CREATE TABLE "chat_messages" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "sender_id" integer NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "contact_messages" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "name" varchar,
  "email" varchar,
  "subject" varchar,
  "message" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "colony_logs" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_id" integer,
  "action" varchar NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "air_quality" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "sulfur_level" decimal NOT NULL,
  "alert_red" boolean NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX ON "two_factor_codes" ("user_id", "expires_at");
CREATE UNIQUE INDEX ON "product_votes" ("user_id", "product_id");
CREATE UNIQUE INDEX ON "cart_items" ("cart_id", "product_id");
CREATE UNIQUE INDEX ON "shift_notes" ("user_id", "note_date", "shift");

ALTER TABLE "users" ADD FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "two_factor_codes" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "products" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "price_history" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "product_votes" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "product_votes" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "carts" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "cart_items" ADD FOREIGN KEY ("cart_id") REFERENCES "carts" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "cart_items" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "orders" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "orders" ADD FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "order_items" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "order_items" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "shift_notes" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "chat_messages" ADD FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
ALTER TABLE "colony_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

COMMIT;
