import { expect, test } from '@playwright/test';

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
