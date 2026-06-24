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
       '$2b$12$wU2wFpj1bpqRyzUUMCXiSeRl2HJnNefBiqdDnQ2AzwyrOrgZzY8de',
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

-- Catalogue étendu : remplit la vitrine et la page catalogue.
-- Idempotent : chaque ligne n'est insérée que si le produit n'existe pas déjà.
INSERT INTO "products" ("category_id", "name", "description", "url", "stock", "price")
SELECT category."id", seed_product."name", seed_product."description",
       seed_product."url", seed_product."stock"::int, seed_product."price"::numeric
FROM (VALUES
  ('Mécanismes', 'Roue dentée de précision',
   'Engrenage taillé au micron pour les mouvements d''horlogerie lourde.',
   'https://images.unsplash.com/photo-1516192518150-0d8fee5425e3?auto=format&fit=crop&w=900&q=80', 40, 18.00),
  ('Mécanismes', 'Régulateur à billes',
   'Stabilise la rotation des turbines à vapeur les plus capricieuses.',
   'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=900&q=80', 22, 64.50),
  ('Mécanismes', 'Clé à molette pneumatique',
   'Serre et desserre les boulons rivés sous haute pression.',
   'https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=900&q=80', 35, 27.90),
  ('Mécanismes', 'Détendeur de pression',
   'Évite l''explosion des chaudières en relâchant la vapeur excédentaire.',
   'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&w=900&q=80', 18, 73.00),
  ('Mécanismes', 'Boussole gyroscopique',
   'Garde le cap malgré les champs magnétiques des cités de fer.',
   'https://images.unsplash.com/photo-1516192518150-0d8fee5425e3?auto=format&fit=crop&w=900&q=80', 12, 132.00),
  ('Alambics', 'Condenseur à serpentin',
   'Refroidit la vapeur et récupère les essences précieuses goutte à goutte.',
   'https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=900&q=80', 16, 58.00),
  ('Alambics', 'Filtre à charbon actif',
   'Purifie les distillats les plus douteux des bas quartiers.',
   'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=900&q=80', 60, 9.90),
  ('Alambics', 'Brûleur à éther portatif',
   'Flamme bleue réglable pour distiller en pleine expédition.',
   'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&w=900&q=80', 9, 110.00),
  ('Alambics', 'Fiole de vapeur condensée',
   'Réserve d''énergie compacte pour les automates de poche.',
   'https://images.unsplash.com/photo-1516192518150-0d8fee5425e3?auto=format&fit=crop&w=900&q=80', 75, 6.50),
  ('Reliques', 'Médaillon de l''ancien monde',
   'Grave un visage oublié des temps d''avant la grande fumée.',
   'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&w=900&q=80', 5, 320.00),
  ('Reliques', 'Carte stellaire gravée',
   'Plaque de cuivre où dort une carte du ciel disparu.',
   'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=900&q=80', 7, 175.00),
  ('Reliques', 'Plume automate',
   'Écrit seule les dernières volontés de son ancien propriétaire.',
   'https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=900&q=80', 4, 240.00)
) AS seed_product("cat_name", "name", "description", "url", "stock", "price")
JOIN "categories" category ON category."name" = seed_product."cat_name"
WHERE NOT EXISTS (
  SELECT 1 FROM "products" WHERE "products"."name" = seed_product."name"
);

-- Likes de base pour que la vitrine ait une pression populaire visible.
INSERT INTO "users" ("username", "email", "password_hash", "role_id")
SELECT seed_user."username", seed_user."email",
       '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RAES6.Hy',
       (SELECT "id" FROM "roles" WHERE "name" = 'User')
FROM (VALUES
  ('voteur-cuivre-01', 'voteur-cuivre-01@example.com'),
  ('voteur-cuivre-02', 'voteur-cuivre-02@example.com'),
  ('voteur-cuivre-03', 'voteur-cuivre-03@example.com'),
  ('voteur-cuivre-04', 'voteur-cuivre-04@example.com'),
  ('voteur-cuivre-05', 'voteur-cuivre-05@example.com')
) AS seed_user("username", "email")
WHERE NOT EXISTS (
  SELECT 1 FROM "users" WHERE "username" = seed_user."username"
);

INSERT INTO "product_votes" ("user_id", "product_id")
SELECT voter."id", product."id"
FROM (VALUES
  ('Engrenage en laiton', 'voteur-cuivre-01'),
  ('Engrenage en laiton', 'voteur-cuivre-02'),
  ('Engrenage en laiton', 'voteur-cuivre-03'),
  ('Alambic de poche', 'voteur-cuivre-01'),
  ('Alambic de poche', 'voteur-cuivre-04'),
  ('Montre à gousset fêlée', 'voteur-cuivre-02'),
  ('Montre à gousset fêlée', 'voteur-cuivre-05'),
  ('Lanterne d''éther', 'voteur-cuivre-01'),
  ('Lanterne d''éther', 'voteur-cuivre-02'),
  ('Lanterne d''éther', 'voteur-cuivre-03'),
  ('Lanterne d''éther', 'voteur-cuivre-04'),
  ('Régulateur à billes', 'voteur-cuivre-01'),
  ('Régulateur à billes', 'voteur-cuivre-05'),
  ('Boussole gyroscopique', 'voteur-cuivre-02'),
  ('Boussole gyroscopique', 'voteur-cuivre-03'),
  ('Boussole gyroscopique', 'voteur-cuivre-05'),
  ('Condenseur à serpentin', 'voteur-cuivre-04'),
  ('Médaillon de l''ancien monde', 'voteur-cuivre-01'),
  ('Médaillon de l''ancien monde', 'voteur-cuivre-02'),
  ('Carte stellaire gravée', 'voteur-cuivre-03'),
  ('Plume automate', 'voteur-cuivre-05')
) AS seeded_vote("product_name", "username")
JOIN "products" product ON product."name" = seeded_vote."product_name"
JOIN "users" voter ON voter."username" = seeded_vote."username"
ON CONFLICT ("user_id", "product_id") DO NOTHING;

-- Code promo de test
INSERT INTO "discount_codes" ("code", "percentage", "active") VALUES
  ('VAPEUR10', 10, true)
ON CONFLICT ("code") DO NOTHING;
