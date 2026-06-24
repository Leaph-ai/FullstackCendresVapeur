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
