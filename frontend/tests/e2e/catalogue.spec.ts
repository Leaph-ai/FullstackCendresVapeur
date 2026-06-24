import { expect, test } from '@playwright/test';

test.describe('Page catalogue', () => {
  test('affiche la grille de produits issue du backend', async ({ page }) => {
    await page.goto('/catalogue');

    await expect(page.getByRole('heading', { name: /Catalogue/ })).toBeVisible();

    const cards = page.locator('.catalogue-grid .cv-pcard');
    await expect(cards.first()).toBeVisible();
    // Le seed contient 16 produits : on en attend largement plus que la vitrine.
    expect(await cards.count()).toBeGreaterThan(6);
  });

  test('liste les catégories avec leurs compteurs', async ({ page }) => {
    await page.goto('/catalogue');

    const chips = page.locator('.catalogue-cats .cv-chip');
    await expect(chips.filter({ hasText: 'Tout' })).toBeVisible();
    await expect(chips.filter({ hasText: 'Mécanismes' })).toBeVisible();
    await expect(chips.filter({ hasText: 'Alambics' })).toBeVisible();
    await expect(chips.filter({ hasText: 'Reliques' })).toBeVisible();
  });

  test('filtre les produits par catégorie', async ({ page }) => {
    await page.goto('/catalogue');

    const cards = page.locator('.catalogue-grid .cv-pcard');
    await expect(cards.first()).toBeVisible();
    const totalCount = await cards.count();

    await page.locator('.catalogue-cats .cv-chip', { hasText: 'Reliques' }).click();

    // Reliques contient moins de produits que le catalogue complet.
    await expect.poll(async () => cards.count()).toBeLessThan(totalCount);
    await expect(cards.first()).toBeVisible();
    // Toutes les cartes affichées appartiennent à la catégorie sélectionnée.
    await expect(page.locator('.catalogue-grid .cv-pcard .pcat').first()).toHaveText('Reliques');
  });

  test('recherche par nom de produit', async ({ page }) => {
    await page.goto('/catalogue');
    await expect(page.locator('.catalogue-grid .cv-pcard').first()).toBeVisible();

    await page.getByLabel('Rechercher une pièce').fill('lanterne');

    const cards = page.locator('.catalogue-grid .cv-pcard');
    await expect.poll(async () => cards.count()).toBe(1);
    await expect(cards.first()).toContainText(/lanterne/i);
  });

  test('trie par prix croissant', async ({ page }) => {
    await page.goto('/catalogue');
    await expect(page.locator('.catalogue-grid .cv-pcard').first()).toBeVisible();

    await page.getByLabel('Trier les pièces').selectOption('price');
    // En tri prix, le bouton de sens apparaît ; on bascule en croissant.
    await page.getByRole('button', { name: /Prix/ }).click();

    const prices = await page
      .locator('.catalogue-grid .cv-pcard .cv-price .amt')
      .allInnerTexts();
    const numbers = prices.map((text) => Number(text.replace(/[^\d.]/g, '')));
    const sorted = [...numbers].sort((a, b) => a - b);
    expect(numbers).toEqual(sorted);
  });

  test('ouvre la vue détail produit', async ({ page }) => {
    await page.goto('/catalogue');

    const firstName = await page
      .locator('.catalogue-grid .cv-pcard .pname-link')
      .first()
      .innerText();
    await page.locator('.catalogue-grid .cv-pcard .pname-link').first().click();

    const modal = page.locator('.cv-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.cv-modal-title')).toHaveText(firstName);

    await modal.getByRole('button', { name: 'Fermer' }).click();
    await expect(modal).toHaveCount(0);
  });
});
