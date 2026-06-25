import { expect, test } from '@playwright/test';
import { registerAndLogin } from './helpers';

const API = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:8000';

test.describe('Journal des survivants', () => {
  test('affiche des entrées réelles issues du backend', async ({ page }) => {
    // Une inscription écrit un vrai événement dans le journal.
    await page.request.post(`${API}/auth/register`, {
      data: { email: `e2e_journal_${Date.now()}@example.com`, password: 'VapeurSecret123' },
    });

    await page.goto('/');
    const items = page.locator('#journal .cv-fitem');
    await expect.poll(async () => items.count(), { timeout: 10000 }).toBeGreaterThan(0);
    // Le flux n'est plus le mock : pas d'état vide affiché.
    await expect(page.locator('#journal .cv-note')).toHaveCount(0);
    // Les horodatages proviennent de vrais created_at (format "HH:MM · cycle JJ").
    await expect(items.first().locator('.ts')).toHaveText(/\d{2}:\d{2} · cycle \d+/);
  });

  test('une tentative de connexion refusée est consignée comme alerte', async ({ request }) => {
    const { email } = await registerAndLogin(request);

    const failed = await request.post(`${API}/auth/login`, {
      data: { email, password: 'mauvaisecle' },
    });
    expect(failed.status()).toBe(401);

    const entries = (await (await request.get(`${API}/journal/?limit=50`)).json()) as {
      type: string;
    }[];
    expect(entries.some((e) => e.type === 'alert')).toBeTruthy();
  });
});

test.describe('Journal des survivants — live feed', () => {
  test('affiche les entrées du feed public, préfixe retiré', async ({ page }) => {
    await page.route('**/api/logs/feed*', async (route) => {
      await route.fulfill({
        json: [
          { id: 1, message: 'événement: Alerte rouge — taux de soufre à 82', created_at: '2026-06-24T14:05:00Z' },
          { id: 2, message: 'vote: +1 sur Boussole en laiton', created_at: '2026-06-24T14:06:00Z' },
        ],
      });
    });

    await page.goto('/');
    const feed = page.locator('#journal .cv-feed');
    await expect(feed.getByText('Alerte rouge — taux de soufre à 82')).toBeVisible();
    await expect(feed.getByText('+1 sur Boussole en laiton')).toBeVisible();
    // Le préfixe technique ne doit pas apparaître tel quel.
    await expect(feed.getByText('événement:')).toHaveCount(0);
    // L'alerte rouge porte la classe de style dédiée.
    await expect(feed.locator('.cv-fitem.alert')).toHaveCount(1);
  });

  test('retombe sur le mock quand le feed est vide', async ({ page }) => {
    await page.route('**/api/logs/feed*', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto('/');
    const feed = page.locator('#journal .cv-feed');
    // Une entrée connue du mock JOURNAL_LOGS doit rester visible.
    await expect(feed.getByText(/Régulateur de pression Mk\.III/)).toBeVisible();
  });
});
