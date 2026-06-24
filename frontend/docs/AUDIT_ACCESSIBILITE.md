# Audit d'accessibilité — « Cendres et Vapeur » (frontend)

> Audit réalisé le 2026-06-24 sur le frontend React 19 / Vite.
> Méthode : tests Playwright automatisés (`@axe-core/playwright`, WCAG 2.1 A & AA)
> + inspection DOM/sémantique runtime + relecture des sources + vérifications clavier/focus.
> **Portée : audit et plan d'amélioration uniquement — aucun correctif n'a été appliqué au code applicatif (`src/`).**

## 1. Méthodologie et environnement

| Élément | Détail |
| --- | --- |
| Navigateur | Chromium (Desktop Chrome) via Playwright 1.61 |
| Moteur de règles | axe-core, tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` |
| Backend | FastAPI `:8000`, `APP_ENV=dev` (2FA désactivée), Postgres seedé |
| États testés | invité **et** admin connecté (compte promu rôle 3) |
| Harnais (test tooling, non applicatif) | `tests/e2e/a11y.spec.ts` (scan axe par route), `tests/e2e/a11y-dom.spec.ts` (landmarks, titres, noms de champs, pièges de focus), `tests/e2e/a11y-filled.spec.ts` (panier/checkout remplis) |
| Rapports bruts | `frontend/a11y-report/axe/*.json` et `frontend/a11y-report/dom/*.json` (annexe) |

**Limite méthodologique assumée.** axe-core ne couvre qu'une partie des critères WCAG
(≈ 30–40 %). Les constats les plus structurants de cet audit (labels par *placeholder*,
absence de piège de focus, hiérarchie de titres, lien d'évitement) viennent des
vérifications **manuelles/DOM**, pas d'axe — d'où le faible nombre de violations axe brutes
malgré des notes parfois basses.

### Barème de notation

Chaque fonction est notée **/100** et en **lettre A–F**, à partir de quatre principes WCAG
pondérés :

- **Perceptible** (25) — contraste, alternatives textuelles, sémantique du contenu
- **Utilisable** (35) — accès clavier, gestion du focus, cibles, pas de piège
- **Compréhensible** (25) — labels, instructions, signalement d'erreurs
- **Robuste** (15) — ARIA correct, rôles, landmarks

Échelle : A ≥ 90 · B 78–89 · C 65–77 · D 50–64 · F < 50.

## 2. Tableau de synthèse

| # | Fonction | Note | Score | Top problèmes |
| --- | --- | :---: | :---: | --- |
| 1 | Accueil `/` | **A−** | 88 | Pas de lien d'évitement ; saut de titres h2→h4 ; graphiques sans alt |
| 2 | Catalogue `/catalogue` | **C** | 75 | Pas de `h1` ; tuiles image `div role=button` ; `role=tablist` détourné pour les filtres |
| 3 | Modale produit + carte | **C** | 65 | Aucune gestion de focus (pas de piège, pas de restauration) ; contrastes catégorie/badge |
| 4 | Connexion `/login` | **C+** | 74 | Pas de `<main>` ; saut h1→h3 ; contraste du bouton (3.79) |
| 5 | Inscription `/register` | **F** | 52 | 3 champs sans label (placeholder seul) ; erreurs via `alert()` ; pas de `<main>` |
| 6 | Mot de passe oublié/reset | **C+** | 74 | Pas de `<main>` ; contraste du bouton ; pas de lien d'évitement |
| 7 | Vérification 2FA `/verify-2fa` | **D** | 58 | Champ code sans label ; erreurs via `alert()` ; pas de `<main>` |
| 8 | Panier `/cart` | **D+** | 62 | Champ quantité sans nom (violation axe `label`) ; en-têtes en `<div>` ; pas de `<main>` |
| 9 | Tunnel de commande `/checkout` | **B** | 78 | Formulaire bien labellisé ; mais pas de `<main>`, étapes non annoncées, contraste bouton |
| 10 | Administration `/admin` | **C** | 70 | Tableau scrollable inaccessible au clavier ; pas de `scope` sur les `<th>` |
| 11 | Chat « Télégraphe de l'Ombre » | **D+** | 60 | Pas de `role=dialog`/`aria-modal` ; pas d'Échap ; pas de piège de focus ; contraste notice |
| 12 | Navigation + 404 + toasts | **B** | 80 | Pas d'`aria-current` sur l'onglet actif ; pas de lien d'évitement global |

**Note globale : C (≈ 70/100).** Le socle est sain (sémantique HTML, beaucoup d'`aria-label`,
styles `:focus-visible`, `prefers-reduced-motion` respecté, régions live sur les alertes). Les
pertes viennent de **manques transverses systématiques** (lien d'évitement, `<main>` sur les
pages secondaires, gestion du focus des modales, contraste des boutons cuivre) plus que de
défauts isolés.

## 3. Problèmes transverses (à traiter en priorité — fort effet de levier)

Ces points pénalisent plusieurs fonctions à la fois ; les corriger remonte la note de l'app
globalement.

- **T1 — Aucun lien d'évitement « Aller au contenu ».** *(P1)* Aucune des pages testées n'en
  propose. Ajouter un skip-link en tête de `SteampunkPageShell`
  (`src/lib/cv/components/layout/SteampunkPageShell.tsx`) et des shells `auth-shell`, ciblant
  `#contenu` posé sur le `<main>`. WCAG 2.4.1.
- **T2 — `<main>` manquant sur les pages secondaires.** *(P1)* Présent sur Accueil, Catalogue,
  404 ; **absent** sur Login, Register, Forgot/Reset, 2FA, Panier, Checkout (toutes en
  `auth-shell`/markup ad hoc). Encapsuler le contenu principal dans `<main id="contenu">`.
  WCAG 1.3.1 / 2.4.1.
- **T3 — Contraste des boutons primaires.** *(P1)* Le bouton CTA (texte blanc `#fff` sur cuivre
  `#b87333`) est à **3.79:1** (< 4.5 requis) sur Login/Register/Forgot/Reset/2FA. Assombrir le
  cuivre du bouton ou la graisse/taille du texte. Auditer les tokens de
  `src/lib/cv/styles/components.css`. WCAG 1.4.3.
- **T4 — Aucun outillage a11y en place.** *(P2)* Pas de `eslint-plugin-jsx-a11y`, pas de scan
  axe en CI. Les régressions ne sont pas détectées.
- **T5 — Gestion du focus des modales absente.** *(P1)* ProductModal **et** ChatModal ne
  déplacent pas le focus à l'ouverture, ne le piègent pas, ne le restaurent pas à la fermeture
  (mesuré : le focus s'échappe dans les deux cas). Créer un hook réutilisable `useFocusTrap`
  (focus initial + cycle Tab/Shift+Tab + restauration). WCAG 2.4.3 / 2.1.2.
- **T6 — Erreurs de formulaire via `alert()`.** *(P2)* Register et Verify2FA signalent les
  erreurs par `window.alert()` (et non par un message associé au champ via `aria-describedby`
  dans une région live). WCAG 3.3.1.

## 4. Détail par fonction

### 1. Accueil `/` — A− (88)

**État actuel (bon).** `h1` unique présent ; **tous les landmarks** (`main`, `nav`, `header`,
`footer`) ; formulaire de contact entièrement labellisé (`label[for]` pour identifiant, email,
objet, message — `ContactSection`) ; alerte toxicité en `role="alert"` + `aria-live` ;
`prefers-reduced-motion` respecté ; **0 violation axe**.

**Constats.**
- Saut de hiérarchie de titres : `h2` (sections) → `h4` (colonnes du footer Comptoir/Colonie/Guilde), pas de `h3`.
- Visualisations de données sans alternative textuelle : `SparkChart` (tendance cuivre), jauges Nixie de `ChiffresSection`, moniteur de toxicité.
- Pas de lien d'évitement (cf. T1).

**Plan d'amélioration.**
- **P2** — Rétablir la continuité des titres (footer en `h2`/`h3`, ou rôles non-titres si décoratifs).
- **P2** — Donner un équivalent texte aux graphiques : `role="img"` + `aria-label` synthétique (« Cuivre : 42 ⵟ, en hausse ») ou résumé visuellement masqué.
- **P3** — Skip-link (traité en T1).

### 2. Catalogue `/catalogue` — C (75)

**État actuel.** Barre de filtres en `role="search"` ; recherche et tri avec `aria-label`
(« Rechercher une pièce », « Trier les pièces ») ; `prefers-reduced-motion` ; **0 violation axe**.

**Constats.**
- **Pas de `h1`** : la page commence en `h2` (« Catalogue — toutes les pièces »).
- **16 contrôles `role="button"` sans nom textuel** : les tuiles image produit
  (`ProductCard`, `div.cv-ph[role=button][tabindex=0]`, `src/lib/cv/components/sections/ProductCard.tsx:52`) — contrôle **redondant** avec le bouton « nom du produit » juste en dessous.
- **`role="tablist"` / `role="tab"` détourné** pour les filtres catégorie
  (`Catalogue.tsx:148-167`) : le pattern *tabs* impose un `tabpanel` associé et une navigation
  par flèches (roving tabindex) absents ici. Ce sont des **boutons-filtres**, pas des onglets.

**Plan d'amélioration.**
- **P1** — Ajouter un `h1` (« Catalogue ») et faire redescendre les titres de section.
- **P2** — Remplacer la tuile `div role=button` par un vrai `<button>` (ou supprimer le contrôle redondant et ne garder que le bouton-nom comme déclencheur de détail).
- **P2** — Pour les filtres : soit des `<button aria-pressed>` dans un `role="group" aria-label="Catégories"`, soit un vrai pattern tabs complet (tabpanel + flèches).
- **P3** — Annoncer le nombre de résultats après filtrage via une région `aria-live="polite"`.

### 3. Modale produit + carte produit — C (65)

**État actuel (bon).** `ProductModal` : `role="dialog"` + `aria-modal="true"` + `aria-label` ;
bouton fermer avec `aria-label="Fermer"` ; **Échap ferme** (mesuré) ; verrouillage du scroll
du `body` ; like en `aria-pressed` ; image `alt={product.name}`.

**Constats (mesurés au clavier).**
- **Aucune gestion du focus** : à l'ouverture le focus reste sur le `<body>` (pas déplacé dans la modale) ; **le focus s'échappe** de la modale en tabulant ; pas de restauration au déclencheur. (`src/lib/cv/components/sections/ProductModal.tsx` — seul un handler Échap est posé.)
- **Contraste** : `.cv-modal-cat` `#b3703f`/`#ece2cc` = **3.07** ; `.cv-badge` `#4f7a6d`/`#dfdac4` = **3.45** (< 4.5).
- Carte : même anti-pattern `div role=button` que ci-dessus.

**Plan d'amélioration.**
- **P1** — Brancher `useFocusTrap` (T5) : focus initial sur le titre ou le bouton fermer, cycle Tab piégé, restauration à la fermeture.
- **P1** — Corriger les contrastes catégorie/badge (assombrir le texte ou le fond).
- **P2** — Convertir la tuile en `<button>` natif.

### 4. Connexion `/login` — C+ (74)

**État actuel.** Champs email/mot de passe avec `aria-label` ; `h1` présent ; `:focus-visible`.

**Constats.**
- **Pas de `<main>`** (page en `auth-shell`).
- Saut de titres `h1` (« CENDRES & VAPEUR ») → `h3` (« 🔒 Transmission sécurisée »).
- Bouton CTA à 3.79:1 (T3).
- Pas de lien d'évitement.
- Préférer de vrais `<label>` visibles aux `aria-label` (meilleure cible de clic, robustesse).

**Plan d'amélioration.**
- **P1** — Encapsuler dans `<main id="contenu">` (T2) ; corriger le contraste du bouton (T3).
- **P2** — Convertir les `aria-label` en `<label for>` visibles ; corriger le niveau du sous-titre.
- **P2** — Associer les erreurs de connexion à une région `role="alert"` plutôt qu'à un état muet.

### 5. Inscription `/register` — F (52)

**État actuel.** `h1` présent. C'est la fonction la plus en retrait.

**Constats (mesurés).**
- **3 champs sans nom programmatique** : email, mot de passe, confirmation n'ont **que des `placeholder`** — ni `<label>`, ni `aria-label`, ni `id` (`src/pages/Register/register.tsx:90-114`). Le placeholder disparaît à la saisie : échec WCAG 1.3.1 et 3.3.2.
- **Erreurs via `window.alert()`** (mots de passe non concordants, erreur serveur) : non associées aux champs, non persistantes, hors région live (`register.tsx:22,60`).
- **Pas de `<main>`** ; bouton CTA à 3.79:1.
- Pas d'indication des règles de mot de passe avant soumission.

**Plan d'amélioration.**
- **P1** — Ajouter `<label for>` + `id` à chacun des 3 champs ; lier la confirmation au champ mot de passe.
- **P1** — Remplacer les `alert()` par des messages d'erreur inline associés via `aria-describedby` dans une région `role="alert"`/`aria-live="assertive"`.
- **P1** — `<main id="contenu">` (T2) ; contraste bouton (T3).
- **P2** — Décrire les contraintes de mot de passe (`aria-describedby`).

### 6. Mot de passe oublié / Réinitialisation — C+ (74)

**État actuel.** Champs avec `aria-label` (email ; et code + nouveau mot de passe pour reset) ;
`h1` présent sur les deux pages.

**Constats.** Pas de `<main>` ; bouton CTA 3.79:1 ; pas de lien d'évitement ; champ « Code de
récupération » à fiabiliser (`inputmode`/`autocomplete one-time-code`).

**Plan d'amélioration.**
- **P1** — `<main>` (T2) + contraste bouton (T3).
- **P2** — `<label>` visibles ; `autocomplete="one-time-code"` + `inputmode="numeric"` sur le code ; confirmation de succès dans une région live.

### 7. Vérification 2FA `/verify-2fa` — D (58)

**État actuel.** `h1` présent ; bouton « Valider ».

**Constats (mesurés).**
- **Champ code sans nom** : `placeholder="350285"` seul, ni `<label>` ni `aria-label` (`src/pages/Verify2FA/verify2FA.tsx:104-112`).
- **Erreurs via `alert()`** (« Session expirée », « Code invalide »).
- Pas de `<main>` ; bouton CTA 3.79:1.

**Plan d'amélioration.**
- **P1** — `<label for>` explicite (« Code de vérification ») ; `autocomplete="one-time-code"`, `inputmode="numeric"`, `pattern="\d{6}"`.
- **P1** — Erreurs inline associées (région live), pas d'`alert()`.
- **P1** — `<main>` (T2) ; contraste (T3).

### 8. Panier `/cart` — D+ (62)

**État actuel.** `h1` présent ; bouton retirer avec `title="Retirer du panier"` (nom accessible OK).

**Constats (mesurés, panier rempli).**
- **Champ quantité sans nom** : `<input type="number">` sans `<label>`/`aria-label` —
  **violation axe `label` (serious)** (`src/pages/Panier/cart.tsx:78-85`).
- **En-têtes de colonnes en `<div>`** (« Prix unit. », « Quantité »…), pas un `<table>` ni des
  cellules associées : la grille est purement visuelle, non exploitable au lecteur d'écran (`cart.tsx:57-105`).
- Pas de `<main>` ; pas de lien d'évitement.

**Plan d'amélioration.**
- **P1** — Donner un nom au champ quantité : `aria-label={`Quantité pour ${item.name}`}`.
- **P2** — Restructurer la grille en `<table>` (en-têtes `<th scope="col">`) ou en liste de descriptions correctement reliée ; remplacer le `title` du bouton retirer par un `aria-label` explicite incluant le nom de l'article.
- **P1** — `<main>` (T2).

### 9. Tunnel de commande `/checkout` — B (78)

**État actuel (bon).** Formulaire d'adresse **entièrement labellisé** : 8 champs, tous reliés
par `label[for]` (prénom, nom, email, téléphone, adresse, ville, code postal, pays) ; `h1`
présent à l'étape remplie ; **0 violation axe**.

**Constats.**
- Pas de `<main>`.
- **Indicateur d'étapes (1/2/3) probablement visuel seul** : l'étape courante n'est pas annoncée (pas de `aria-current="step"` ni de mise à jour live « Étape 2 sur 3 »).
- L'état « panier vide » du checkout n'a **pas de `h1`** (page commence en `h2`).
- Bouton CTA 3.79:1 (T3).

**Plan d'amélioration.**
- **P1** — `<main>` (T2) ; contraste bouton (T3).
- **P2** — Indicateur d'étapes accessible : liste ordonnée avec `aria-current="step"` + annonce live du changement d'étape ; déplacer le focus sur le titre de la nouvelle étape.
- **P2** — Ajouter un `h1` à l'état vide ; ajouter les attributs `autocomplete` HTML (`given-name`, `email`, `postal-code`, …) aux champs.

### 10. Administration `/admin` — C (70)

**État actuel (bon).** Vraies `<table><thead>` dans Users/Products/Orders ; recherche
utilisateurs avec `aria-label`. Onglets Produits/Commandes pilotables.

**Constats (mesurés).**
- **`scrollable-region-focusable` (axe, serious)** : `.panel-table-wrapper` défile mais n'est
  pas focusable au clavier → contenu débordant inaccessible sans souris.
- **Pas de `scope="col"`** sur les `<th>` : associations cellule/en-tête non explicites pour les grands tableaux.
- Pas de `<main>` dédié dans le shell admin.
- Le formulaire de création/édition produit (`ProductsPanel`) est à auditer en détail pour ses labels.

**Plan d'amélioration.**
- **P1** — Rendre le wrapper de tableau focusable : `tabindex="0"` + `role="region"` + `aria-label` (table déléguée au clavier).
- **P2** — Ajouter `scope="col"` (et `scope="row"` si pertinent) aux en-têtes ; encapsuler le panneau dans `<main>`.
- **P2** — Vérifier que chaque action de ligne (éditer/supprimer) a un nom accessible incluant l'entité concernée.

### 11. Chat « Télégraphe de l'Ombre » (`ChatModal`) — D+ (60)

**État actuel (bon).** Boutons ouvrir/fermer/envoyer avec `aria-label` ; champ message
`aria-label="Message à envoyer"` ; indicateur de frappe en `aria-live="polite"`.

**Constats (mesurés).**
- **La modale n'est pas un dialogue** : `<div className="chat-modal">` **sans `role="dialog"` ni `aria-modal="true"`** (`src/components/chatModal/chatModal.tsx:166`).
- **Pas d'Échap pour fermer** (mesuré : Échap ne ferme pas) — seulement clic overlay/bouton.
- **Aucune gestion du focus** : non déplacé à l'ouverture, **s'échappe** de la modale, non restauré.
- **Contraste** : `.chat-state-notice` `#897c64`/`#f3ecdc` = **3.47** (< 4.5).
- `h3` isolé en tête de modale (à confirmer dans le contexte de titres).

**Plan d'amélioration.**
- **P1** — Ajouter `role="dialog"` + `aria-modal="true"` + `aria-labelledby` (vers le titre) sur `.chat-modal`.
- **P1** — Support Échap + `useFocusTrap` (T5) : focus initial sur le champ message, piège, restauration sur le bouton flottant.
- **P1** — Corriger le contraste de la notice d'état.
- **P2** — Annoncer l'arrivée de nouveaux messages (région live) sans casser le défilement.

### 12. Navigation globale + 404 + notifications — B (80)

**État actuel (bon).** `Topbar` : `<nav aria-label="Navigation principale">` ; liens icônes
(panier, admin, login) avec `aria-label` (le panier inclut le nombre d'articles) ; SVG
`aria-hidden`. Toasts en `aria-live="assertive"` + `role="alert"` ; `ErrorBanner` idem ; page
404 en `role="main"` avec `h1`.

**Constats.**
- **Pas d'`aria-current`** sur le lien de navigation actif (état signalé seulement par la classe `cur`) — `src/lib/cv/components/layout/Topbar.tsx`.
- Pas de lien d'évitement global (T1).
- La 404 n'a ni `nav` ni `header` (navigation de secours limitée).

**Plan d'amélioration.**
- **P2** — Ajouter `aria-current="page"` sur le lien actif du `Topbar`.
- **P2** — Proposer une navigation/retour accueil sur la page 404.
- **P3** — `aria-atomic`/`aria-live="polite"` à ajuster selon la criticité des toasts (assertive réservé aux erreurs).

## 5. Feuille de route recommandée

1. **Vague P1 (bloquants, fort levier)** — T1 (skip-link), T2 (`<main>`), T3 (contraste boutons),
   T5 (hook `useFocusTrap` + l'appliquer à ProductModal & ChatModal), labels manquants
   (Register, 2FA, quantité panier), `role=dialog`/Échap du chat, wrapper de tableau admin focusable.
2. **Vague P2 (importants)** — T4 (`eslint-plugin-jsx-a11y` + axe en CI), T6 (erreurs inline vs
   `alert()`), `h1` manquants (catalogue, checkout vide), `scope` des tableaux, sémantique des
   filtres catalogue, étapes du checkout annoncées, `aria-current` nav.
3. **Vague P3 (confort)** — alternatives textuelles des graphiques, annonces live (résultats
   filtrés, nouveaux messages), navigation de secours 404, `autocomplete` des formulaires.

### Outillage suggéré (P2)
- `eslint-plugin-jsx-a11y` dans `eslint.config.js` (détection au build).
- Le spec `tests/e2e/a11y.spec.ts` peut devenir un garde-fou CI : passer d'un rapport à une
  assertion (`expect(violations).toEqual([])`) une fois les P1 résorbés, route par route.
- Util de piège de focus réutilisable (`src/lib/cv/hooks/useFocusTrap.ts`) consommé par toutes les modales.
- Audit systématique des tokens de couleur (`src/lib/cv/styles/`) au ratio AA (4.5:1 texte, 3:1 UI).

## 6. Annexes

- Rapports axe bruts par écran (invité + admin) : `frontend/a11y-report/axe/*.json`
- Rapports DOM (landmarks, titres, noms de champs, pièges de focus) : `frontend/a11y-report/dom/*.json`
- Specs d'audit : `frontend/tests/e2e/a11y.spec.ts`, `a11y-dom.spec.ts`, `a11y-filled.spec.ts`

> Note tests fonctionnels : la suite e2e existante passe à **18/20** ; les 2 échecs de
> `journal.spec.ts` (entrée mock « Régulateur de pression Mk.III » attendue) relèvent d'un
> décalage de données de seed, **pas d'un défaut d'accessibilité**.
