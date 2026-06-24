import { expect, test } from '@playwright/test';

test.describe('Vitrine de la page d’accueil', () => {
  test('met en avant une sélection limitée du vrai catalogue', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('#vitrine .cv-pcard');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    // La vitrine est une sélection « en vedette » (limite de 6).
    expect(count).toBeLessThanOrEqual(6);
  });

  test('le lien « Tout le catalogue » mène à la page catalogue', async ({ page }) => {
    await page.goto('/');

    await page.locator('#vitrine').getByRole('link', { name: /Tout le catalogue/ }).click();

    await expect(page).toHaveURL(/\/catalogue$/);
    await expect(page.getByRole('heading', { name: /Catalogue/ })).toBeVisible();
  });

  test('la barre de navigation expose un lien Catalogue', async ({ page }) => {
    await page.goto('/');

    await page.locator('.tb-nav').getByRole('link', { name: 'Catalogue' }).click();
    await expect(page).toHaveURL(/\/catalogue$/);
  });
});
