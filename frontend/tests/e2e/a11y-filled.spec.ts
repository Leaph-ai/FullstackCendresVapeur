import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

/** Scans panier/checkout AVEC un article (état réel, pas l'état vide). */

const OUT = path.join(process.cwd(), 'a11y-report', 'axe');
const DOM = path.join(process.cwd(), 'a11y-report', 'dom');

function writeJson(dir: string, name: string, data: unknown) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(data, null, 2));
  // eslint-disable-next-line no-console
  console.log(`[filled] ${name} écrit`);
}

async function addItem(page: Page) {
  await page.goto('/catalogue');
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /Ajouter au panier/ }).first().click();
  await page.waitForTimeout(400);
}

async function axeScan(page: Page, name: string) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  writeJson(OUT, name, {
    name,
    counts: { violations: r.violations.length },
    violations: r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
    })),
  });
}

async function domFields(page: Page, name: string) {
  const data = await page.evaluate(() => {
    const fields = Array.from(document.querySelectorAll('input, select, textarea')).map((el) => {
      const id = el.getAttribute('id');
      const hasLabel = id ? Boolean(document.querySelector(`label[for="${CSS.escape(id)}"]`)) : false;
      const name =
        el.getAttribute('aria-label') ||
        (hasLabel ? 'label[for]' : '') ||
        el.getAttribute('title') ||
        (el.getAttribute('placeholder') ? 'placeholder-only' : '') ||
        'AUCUN';
      return { type: (el as HTMLInputElement).type, name };
    });
    return {
      h1: document.querySelectorAll('h1').length,
      main: document.querySelectorAll('main,[role=main]').length,
      fields,
      fieldsWithoutName: fields.filter((f) => f.name === 'AUCUN').length,
    };
  });
  writeJson(DOM, name, data);
}

test('panier rempli', async ({ page }) => {
  await addItem(page);
  await page.goto('/cart');
  await page.waitForTimeout(600);
  await axeScan(page, 'guest-cart-rempli');
  await domFields(page, 'cart-rempli');
  expect(true).toBe(true);
});

test('checkout rempli (étape adresse)', async ({ page }) => {
  await addItem(page);
  await page.goto('/checkout');
  await page.waitForTimeout(800);
  await axeScan(page, 'guest-checkout-rempli');
  await domFields(page, 'checkout-rempli');
  expect(true).toBe(true);
});
