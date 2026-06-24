import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { authenticate, registerAndLogin } from './helpers';

async function fillInfoStep(page: Page, email = 'jean.dupont@example.com') {
  await page.locator('#firstName').fill('Jean');
  await page.locator('#lastName').fill('Dupont');
  await page.locator('#email').fill(email);
  await page.locator('#phone').fill('+33612345678');
  await page.locator('#address').fill('12 rue de la Vapeur');
  await page.locator('#city').fill('Paris');
  await page.locator('#postalCode').fill('75001');
}

function amount(text: string): number {
  return Number(text.replace(/[^\d.]/g, ''));
}

test.describe('Parcours catalogue → paiement', () => {
  test('un client connecté finalise une commande jusqu’à la confirmation', async ({
    page,
    request,
  }) => {
    const { token } = await registerAndLogin(request);
    await authenticate(page, token);

    await page.goto('/catalogue');
    await page
      .locator('.catalogue-grid .cv-pcard')
      .first()
      .getByRole('button', { name: /Ajouter au panier/ })
      .click();
    await expect(page.locator('.tb-acts .cv-iconbtn .cnt')).toHaveText('1');

    await page.goto('/cart');
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await page.getByRole('link', { name: /Passer la commande/ }).click();
    await expect(page).toHaveURL(/\/checkout$/);

    await fillInfoStep(page);
    await page.getByRole('button', { name: /Suivant/ }).click();

    await page.locator('#cardNumber').fill('4242424242424242');
    await page.locator('#cardExpiry').fill('12/29');
    await page.locator('#cardCvc').fill('123');
    await page.locator('#discountCode').fill('VAPEUR10');
    await page.getByRole('button', { name: 'Appliquer' }).click();
    await expect(page.getByText(/Code appliqué/)).toBeVisible();
    await page.getByRole('button', { name: /Suivant/ }).click();

    await page.getByRole('button', { name: /Confirmer le paiement/ }).click();

    await expect(page.getByRole('heading', { name: /Commande confirmée/ })).toBeVisible();
    await expect(page.locator('.order-number')).toContainText(/#ORD-\d+/);

    // La facture reprend le bon numéro de commande et n'est pas vide.
    await page.getByRole('button', { name: /Voir la facture/ }).click();
    await expect(page.locator('.invoice-document')).toBeVisible();
    await expect(page.locator('.invoice-items tbody tr')).toHaveCount(1);
    await expect(page.locator('.invoice-meta .value').first()).toContainText(/ORD-\d+/);
  });

  test('le total est TTC et n’ajoute pas de TVA en plus du prix', async ({ page, request }) => {
    const { token } = await registerAndLogin(request);
    await authenticate(page, token);

    await page.goto('/catalogue');
    await page
      .locator('.catalogue-grid .cv-pcard')
      .first()
      .getByRole('button', { name: /Ajouter au panier/ })
      .click();
    await expect(page.locator('.tb-acts .cv-iconbtn .cnt')).toHaveText('1');

    await page.goto('/checkout');
    await fillInfoStep(page);
    await page.getByRole('button', { name: /Suivant/ }).click();
    await page.locator('#cardNumber').fill('4242424242424242');
    await page.locator('#cardExpiry').fill('12/29');
    await page.locator('#cardCvc').fill('123');
    await page.getByRole('button', { name: /Suivant/ }).click();

    // Sans remise : Total TTC == Sous-total (la TVA est comprise, pas ajoutée).
    const value = (line: ReturnType<Page['locator']>) =>
      line.locator('span').last().innerText().then(amount);

    const subtotal = await value(
      page.locator('.review-summary .summary-line', { hasText: 'Sous-total' }),
    );
    const total = await value(page.locator('.review-summary .summary-line.total'));
    expect(total).toBeCloseTo(subtotal, 2);

    const tva = await value(page.locator('.review-summary .summary-line', { hasText: 'TVA' }));
    expect(tva).toBeCloseTo(total - total / 1.2, 1);
  });

  test('un invité crée un compte express et paie dans la foulée', async ({ page }) => {
    await page.goto('/catalogue');
    await page
      .locator('.catalogue-grid .cv-pcard')
      .first()
      .getByRole('button', { name: /Ajouter au panier/ })
      .click();

    await page.goto('/checkout');
    const email = `e2e_guest_${Date.now()}@example.com`;
    await fillInfoStep(page, email);
    await page.getByRole('button', { name: /Suivant/ }).click();
    await page.locator('#cardNumber').fill('4242424242424242');
    await page.locator('#cardExpiry').fill('12/29');
    await page.locator('#cardCvc').fill('123');
    await page.getByRole('button', { name: /Suivant/ }).click();

    // Panneau de création de compte express
    await expect(page.getByRole('heading', { name: /Créez votre compte/ })).toBeVisible();
    await page.getByRole('button', { name: 'Générer' }).click();
    await expect(page.locator('#accountPassword')).not.toHaveValue('');

    await page.getByRole('button', { name: /Créer le compte et payer/ }).click();

    await expect(page.getByRole('heading', { name: /Commande confirmée/ })).toBeVisible();
    await expect(page.locator('.order-number')).toContainText(/#ORD-\d+/);
  });
});
