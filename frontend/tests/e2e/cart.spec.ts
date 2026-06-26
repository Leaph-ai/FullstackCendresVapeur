import { expect, test } from '@playwright/test';
import { authenticate, registerAndLogin } from './helpers';

test.describe('Ajout au panier — invité (sans connexion)', () => {
  test('ajoute un article et incrémente le compteur sans être connecté', async ({ page }) => {
    await page.goto('/catalogue');

    const cartCount = page.locator('.tb-acts .cv-iconbtn .cnt');
    await expect(cartCount).toHaveText('0');

    await page
      .locator('.catalogue-grid .cv-pcard')
      .first()
      .getByRole('button', { name: /Ajouter au panier/ })
      .click();

    await expect(cartCount).toHaveText('1');
  });

  test('le panier invité persiste sur la page Panier', async ({ page }) => {
    await page.goto('/catalogue');
    await page
      .locator('.catalogue-grid .cv-pcard')
      .first()
      .getByRole('button', { name: /Ajouter au panier/ })
      .click();
    await expect(page.locator('.tb-acts .cv-iconbtn .cnt')).toHaveText('1');

    await page.goto('/cart');
    await expect(page.locator('.cart-item')).toHaveCount(1);
  });
});

test.describe('Ajout au panier — connecté', () => {
  test('ajoute un article et incrémente le compteur du panier', async ({ page, request }) => {
    const { token } = await registerAndLogin(request);
    await authenticate(page, token);

    await page.goto('/catalogue');

    const cartCount = page.locator('.tb-acts .cv-iconbtn .cnt');
    await expect(cartCount).toHaveText('0');

    await page
      .locator('.catalogue-grid .cv-pcard')
      .first()
      .getByRole('button', { name: /Ajouter au panier/ })
      .click();

    await expect(cartCount).toHaveText('1');
  });

  test('ajoute au panier depuis la vue détail', async ({ page, request }) => {
    const { token } = await registerAndLogin(request);
    await authenticate(page, token);

    await page.goto('/catalogue');
    await page.locator('.catalogue-grid .cv-pcard .pname-link').first().click();

    const modal = page.locator('.cv-modal');
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: /Ajouter au panier/ }).click();

    await expect(page.locator('.tb-acts .cv-iconbtn .cnt')).toHaveText('1');
  });
});
