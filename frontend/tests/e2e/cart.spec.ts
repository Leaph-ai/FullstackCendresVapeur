import { expect, test } from '@playwright/test';
import { authenticate, registerAndLogin } from './helpers';

test.describe('Ajout au panier depuis le catalogue', () => {
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
