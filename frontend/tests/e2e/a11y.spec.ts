import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

/**
 * Audit d'accessibilité automatisé (axe-core / WCAG 2.1 A & AA).
 *
 * Ce spec ne sert PAS de garde-fou (il n'échoue pas sur violation) : il PRODUIT
 * un rapport. Pour chaque écran, on injecte axe-core, on scanne, et on écrit le
 * résultat brut dans test-results/a11y/<nom>.json. L'agrégation et la notation
 * se font ensuite à partir de ces fichiers.
 *
 * Pré-requis : backend sur :8000 (APP_ENV=dev), Vite sur :5173.
 * Les écrans admin/chat utilisent un compte promu Admin :
 *   A11Y_ADMIN_EMAIL / A11Y_ADMIN_PASSWORD (défaut ci-dessous).
 */

const API_BASE = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:8000';
const ADMIN_EMAIL = process.env.A11Y_ADMIN_EMAIL ?? 'a11y_admin@example.com';
const ADMIN_PASSWORD = process.env.A11Y_ADMIN_PASSWORD ?? 'VapeurSecret123';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
// Hors `test-results/` que Playwright purge à chaque run.
const OUT_DIR = path.join(process.cwd(), 'a11y-report', 'axe');

type AxeResults = Awaited<ReturnType<AxeBuilder['analyze']>>;

function writeResult(name: string, results: AxeResults): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const slim = {
    name,
    url: results.url,
    timestamp: results.timestamp,
    counts: {
      violations: results.violations.length,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
    },
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      helpUrl: v.helpUrl,
      tags: v.tags,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        html: n.html.slice(0, 300),
        failureSummary: n.failureSummary,
      })),
    })),
  };
  fs.writeFileSync(path.join(OUT_DIR, `${name}.json`), JSON.stringify(slim, null, 2));
  // Trace lisible dans la sortie `list`.
  const ids = slim.violations.map((v) => `${v.id}(${v.impact},x${v.nodes.length})`);
  // eslint-disable-next-line no-console
  console.log(`[a11y] ${name}: ${slim.counts.violations} violations -> ${ids.join(', ') || 'aucune'}`);
}

async function scan(page: Page, name: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  writeResult(name, results);
}

async function loginAdminToken(request: import('@playwright/test').APIRequestContext): Promise<string> {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (!res.ok()) throw new Error(`Login admin échoué (${res.status()}): ${await res.text()}`);
  const body = await res.json();
  return body.access_token as string;
}

/** Laisse le temps aux animations/données live de se poser. */
async function settle(page: Page): Promise<void> {
  // Pas de `networkidle` : l'accueil streame en continu (ticker cuivre), il ne
  // se stabilise jamais. On attend le DOM puis un court délai pour les reveals.
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(900);
}

// ---------------------------------------------------------------------------
// Écrans publics (invité)
// ---------------------------------------------------------------------------

const GUEST_ROUTES: Array<{ name: string; path: string }> = [
  { name: 'guest-accueil', path: '/' },
  { name: 'guest-catalogue', path: '/catalogue' },
  { name: 'guest-login', path: '/login' },
  { name: 'guest-register', path: '/register' },
  { name: 'guest-forgot-password', path: '/forgot-password' },
  { name: 'guest-reset-password', path: '/reset-password' },
  { name: 'guest-verify-2fa', path: '/verify-2fa' },
  { name: 'guest-cart', path: '/cart' },
  { name: 'guest-checkout', path: '/checkout' },
  { name: 'guest-404', path: '/cette-page-nexiste-pas' },
];

for (const route of GUEST_ROUTES) {
  test(`a11y invité ${route.name}`, async ({ page }) => {
    await page.goto(route.path);
    await settle(page);
    await scan(page, route.name);
    expect(true).toBe(true);
  });
}

// Catalogue : ouvrir la modale produit puis scanner.
test('a11y invité modale-produit', async ({ page }) => {
  await page.goto('/catalogue');
  await settle(page);
  const card = page.locator('.cv-pcard .cv-ph.is-clickable, .cv-pcard').first();
  try {
    await card.click({ timeout: 5000 });
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await page.waitForTimeout(400);
  } catch {
    // Pas de produit cliquable : on scanne quand même l'état courant.
  }
  await scan(page, 'guest-modale-produit');
  expect(true).toBe(true);
});

// ---------------------------------------------------------------------------
// Écrans authentifiés (admin / éditeur)
// ---------------------------------------------------------------------------

test.describe('a11y admin', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    token = await loginAdminToken(request);
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((value) => {
      window.localStorage.setItem('access_token', value);
    }, token);
  });

  test('a11y admin panneau (Users)', async ({ page }) => {
    await page.goto('/admin');
    await settle(page);
    await scan(page, 'admin-users');
    expect(true).toBe(true);
  });

  test('a11y admin onglets Products/Orders', async ({ page }) => {
    await page.goto('/admin');
    await settle(page);
    // Onglets : tente de cliquer Produits puis Commandes.
    for (const [label, name] of [
      ['Produits', 'admin-products'],
      ['Commandes', 'admin-orders'],
    ] as const) {
      try {
        await page.getByRole('tab', { name: new RegExp(label, 'i') }).click({ timeout: 3000 });
      } catch {
        await page.getByRole('button', { name: new RegExp(label, 'i') }).click({ timeout: 3000 }).catch(() => {});
      }
      await page.waitForTimeout(500);
      await scan(page, name);
    }
    expect(true).toBe(true);
  });

  test('a11y chat Télégraphe de l’ombre', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    // Ouvre la modale de chat (bouton flottant éditeurs/admins).
    try {
      await page
        .getByRole('button', { name: /t[ée]l[ée]graphe|chat|ombre|message/i })
        .first()
        .click({ timeout: 4000 });
      await page.waitForTimeout(700);
    } catch {
      // Bouton introuvable : scan de l'accueil authentifié.
    }
    await scan(page, 'admin-chat');
    expect(true).toBe(true);
  });
});
