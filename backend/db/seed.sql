-- Données de développement. Idempotent : ré-exécutable sans doublon.

-- Rôles (obligatoires pour que l'app fonctionne)
INSERT INTO "roles" ("name") VALUES
  ('Guest'), ('User'), ('Editor'), ('Admin')
ON CONFLICT ("name") DO NOTHING;

-- Admin de dev.
-- ATTENTION : password_hash = placeholder bcrypt (mot de passe dev "changeme").
-- À réaligner avec le schéma de hash de l'auth quand elle sera implémentée.
INSERT INTO "users" ("username", "email", "password_hash", "role_id")
SELECT 'admin', 'admin@example.com',
       '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RAES6.Hy',
       (SELECT "id" FROM "roles" WHERE "name" = 'Admin')
WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE "username" = 'admin');

-- Migration dev : ancien email .local invalide pour EmailStr (Pydantic)
UPDATE "users" SET "email" = 'admin@example.com'
WHERE "username" = 'admin' AND "email" = 'admin@cendres.local';

-- Catégories
INSERT INTO "categories" ("name") VALUES
  ('Mécanismes'), ('Alambics'), ('Reliques')
ON CONFLICT ("name") DO NOTHING;

-- Compatibilité bases de dev déjà créées avant l'ajout des images produit.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "url" varchar(2048);

-- Produits de test
INSERT INTO "products" ("category_id", "name", "description", "url", "stock", "price")
SELECT (SELECT "id" FROM "categories" WHERE "name" = 'Mécanismes'),
       'Engrenage en laiton', 'Engrenage usiné, dents impeccables.',
       'https://images.unsplash.com/photo-1516192518150-0d8fee5425e3?auto=format&fit=crop&w=900&q=80',
       50, 12.50
WHERE NOT EXISTS (SELECT 1 FROM "products" WHERE "name" = 'Engrenage en laiton');

INSERT INTO "products" ("category_id", "name", "description", "url", "stock", "price")
SELECT (SELECT "id" FROM "categories" WHERE "name" = 'Alambics'),
       'Alambic de poche', 'Distille l''eau saumâtre en vapeur potable.',
       'https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=900&q=80',
       8, 89.90
WHERE NOT EXISTS (SELECT 1 FROM "products" WHERE "name" = 'Alambic de poche');

INSERT INTO "products" ("category_id", "name", "description", "url", "stock", "price")
SELECT (SELECT "id" FROM "categories" WHERE "name" = 'Reliques'),
       'Montre à gousset fêlée', 'Indique une heure d''un monde disparu.',
       'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&w=900&q=80',
       3, 250.00
WHERE NOT EXISTS (SELECT 1 FROM "products" WHERE "name" = 'Montre à gousset fêlée');

INSERT INTO "products" ("category_id", "name", "description", "url", "stock", "price")
SELECT (SELECT "id" FROM "categories" WHERE "name" = 'Alambics'),
       'Lanterne d''éther', 'Diffuse une lueur phosphorescente pour guider les voyages nocturnes.',
       'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=900&q=80',
       14, 45.00
WHERE NOT EXISTS (SELECT 1 FROM "products" WHERE "name" = 'Lanterne d''éther');

UPDATE "products"
SET "url" = CASE "name"
  WHEN 'Engrenage en laiton' THEN 'https://images.unsplash.com/photo-1516192518150-0d8fee5425e3?auto=format&fit=crop&w=900&q=80'
  WHEN 'Alambic de poche' THEN 'https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=900&q=80'
  WHEN 'Montre à gousset fêlée' THEN 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&w=900&q=80'
  ELSE "url"
END
WHERE "url" IS NULL
  AND "name" IN ('Engrenage en laiton', 'Alambic de poche', 'Montre à gousset fêlée');

-- Code promo de test
INSERT INTO "discount_codes" ("code", "percentage", "active") VALUES
  ('VAPEUR10', 10, true)
ON CONFLICT ("code") DO NOTHING;
