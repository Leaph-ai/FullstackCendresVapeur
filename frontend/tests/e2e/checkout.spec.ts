import { expect, test } from '@playwright/test';
import { authenticate, registerAndLogin } from './helpers';

async function fillInfoStep(page: import('@playwright/test').Page) {
  await page.locator('#firstName').fill('Jean');
  await page.locator('#lastName').fill('Dupont');
  await page.locator('#email').fill('jean.dupont@example.com');
  await page.locator('#phone').fill('+33612345678');
  await page.locator('#address').fill('12 rue de la Vapeur');
  await page.locator('#city').fill('Paris');
  await page.locator('#postalCode').fill('75001');
}

test.describe('Parcours catalogue → paiement', () => {
  test('un client connecté finalise une commande jusqu’à la confirmation', async ({
    page,
    request,
  }) => {
    const { token } = await registerAndLogin(request);
    await authenticate(page, token);

    // Catalogue : ajout d'un article
    await page.goto('/catalogue');
    await page
      .locator('.catalogue-grid .cv-pcard')
      .first()
      .getByRole('button', { name: /Ajouter au panier/ })
      .click();
    await expect(page.locator('.tb-acts .cv-iconbtn .cnt')).toHaveText('1');

    // Panier : l'article est présent, on passe la commande
    await page.goto('/cart');
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await page.getByRole('link', { name: /Passer la commande/ }).click();
    await expect(page).toHaveURL(/\/checkout$/);

    // Étape adresse
    await fillInfoStep(page);
    await page.getByRole('button', { name: /Suivant/ }).click();

    // Étape paiement (carte fictive) + code promo
    await page.locator('#cardNumber').fill('4242424242424242');
    await page.locator('#cardExpiry').fill('12/29');
    await page.locator('#cardCvc').fill('123');
    await page.locator('#discountCode').fill('VAPEUR10');
    await page.getByRole('button', { name: 'Appliquer' }).click();
    await expect(page.getByText(/Code appliqué/)).toBeVisible();
    await page.getByRole('button', { name: /Suivant/ }).click();

    // Étape revue → paiement
    await page.getByRole('button', { name: /Confirmer le paiement/ }).click();

    // Confirmation
    await expect(page.getByRole('heading', { name: /Commande confirmée/ })).toBeVisible();
    await expect(page.locator('.order-number')).toContainText(/#ORD-\d+/);
  });

  test('un invité est invité à se connecter au moment de payer', async ({ page }) => {
    await page.goto('/catalogue');
    await page
      .locator('.catalogue-grid .cv-pcard')
      .first()
      .getByRole('button', { name: /Ajouter au panier/ })
      .click();

    await page.goto('/checkout');

    // Adresse
    await fillInfoStep(page);
    await page.getByRole('button', { name: /Suivant/ }).click();
    // Paiement
    await page.locator('#cardNumber').fill('4242424242424242');
    await page.locator('#cardExpiry').fill('12/29');
    await page.locator('#cardCvc').fill('123');
    await page.getByRole('button', { name: /Suivant/ }).click();

    // Revue : le bouton invite à se connecter et redirige vers /login
    const payButton = page.getByRole('button', { name: /Se connecter pour payer/ });
    await expect(payButton).toBeVisible();
    await payButton.click();
    await expect(page).toHaveURL(/\/login\?redirect=\/checkout$/);
  });
});
