-- Données de développement. Idempotent : ré-exécutable sans doublon.

-- Rôles (obligatoires pour que l'app fonctionne)
INSERT INTO "roles" ("name") VALUES
  ('Guest'), ('User'), ('Editor'), ('Admin')
ON CONFLICT ("name") DO NOTHING;

-- Admin de dev.
-- ATTENTION : password_hash = placeholder bcrypt (mot de passe dev "changeme").
-- À réaligner avec le schéma de hash de l'auth quand elle sera implémentée.
INSERT INTO "users" ("username", "email", "password_hash", "role_id")
SELECT 'admin', 'admin@cendres.local',
       '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RAES6.Hy',
       (SELECT "id" FROM "roles" WHERE "name" = 'Admin')
WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE "username" = 'admin');

-- Catégories
INSERT INTO "categories" ("name") VALUES
  ('Mécanismes'), ('Alambics'), ('Reliques')
ON CONFLICT ("name") DO NOTHING;

-- Produits de test
INSERT INTO "products" ("category_id", "name", "description", "stock", "price")
SELECT (SELECT "id" FROM "categories" WHERE "name" = 'Mécanismes'),
       'Engrenage en laiton', 'Engrenage usiné, dents impeccables.', 50, 12.50
WHERE NOT EXISTS (SELECT 1 FROM "products" WHERE "name" = 'Engrenage en laiton');

INSERT INTO "products" ("category_id", "name", "description", "stock", "price")
SELECT (SELECT "id" FROM "categories" WHERE "name" = 'Alambics'),
       'Alambic de poche', 'Distille l''eau saumâtre en vapeur potable.', 8, 89.90
WHERE NOT EXISTS (SELECT 1 FROM "products" WHERE "name" = 'Alambic de poche');

INSERT INTO "products" ("category_id", "name", "description", "stock", "price")
SELECT (SELECT "id" FROM "categories" WHERE "name" = 'Reliques'),
       'Montre à gousset fêlée', 'Indique une heure d''un monde disparu.', 3, 250.00
WHERE NOT EXISTS (SELECT 1 FROM "products" WHERE "name" = 'Montre à gousset fêlée');

-- Code promo de test
INSERT INTO "discount_codes" ("code", "percentage", "active") VALUES
  ('VAPEUR10', 10, true)
ON CONFLICT ("code") DO NOTHING;
