import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';

/**
 * Inspection DOM/sémantique runtime — complète axe-core sur ce qu'il
 * n'automatise pas : landmarks, hiérarchie de titres, noms accessibles des
 * champs de formulaire, lien d'évitement, pièges de focus des modales.
 * Écrit test-results/a11y/dom/<nom>.json. N'échoue jamais : produit un rapport.
 */

const API_BASE = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:8000';
const ADMIN_EMAIL = process.env.A11Y_ADMIN_EMAIL ?? 'a11y_admin@example.com';
const ADMIN_PASSWORD = process.env.A11Y_ADMIN_PASSWORD ?? 'VapeurSecret123';
// Hors `test-results/` que Playwright purge à chaque run.
const OUT_DIR = path.join(process.cwd(), 'a11y-report', 'dom');

function write(name: string, data: unknown): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, `${name}.json`), JSON.stringify(data, null, 2));
  // eslint-disable-next-line no-console
  console.log(`[dom] ${name} écrit`);
}

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(800);
}

/** Extrait la structure sémantique et l'état des formulaires de la page. */
async function inspect(page: Page) {
  return page.evaluate(() => {
    const accName = (el: Element): { name: string; source: string } => {
      const aria = el.getAttribute('aria-label');
      if (aria && aria.trim()) return { name: aria.trim(), source: 'aria-label' };
      const labelledby = el.getAttribute('aria-labelledby');
      if (labelledby) {
        const txt = labelledby
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
          .join(' ')
          .trim();
        if (txt) return { name: txt, source: 'aria-labelledby' };
      }
      const id = el.getAttribute('id');
      if (id) {
        const lbl = document.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (lbl?.textContent?.trim()) return { name: lbl.textContent.trim(), source: 'label[for]' };
      }
      const wrapLabel = el.closest('label');
      if (wrapLabel?.textContent?.trim()) return { name: wrapLabel.textContent.trim(), source: 'label-wrap' };
      const title = el.getAttribute('title');
      if (title && title.trim()) return { name: title.trim(), source: 'title' };
      const ph = el.getAttribute('placeholder');
      if (ph && ph.trim()) return { name: ph.trim(), source: 'placeholder-only' };
      return { name: '', source: 'AUCUN' };
    };

    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h) => ({
      level: Number(h.tagName[1]),
      text: (h.textContent ?? '').trim().slice(0, 80),
    }));

    const landmarks = {
      main: document.querySelectorAll('main, [role="main"]').length,
      nav: document.querySelectorAll('nav, [role="navigation"]').length,
      header: document.querySelectorAll('header, [role="banner"]').length,
      footer: document.querySelectorAll('footer, [role="contentinfo"]').length,
    };

    const fields = Array.from(
      document.querySelectorAll('input, select, textarea'),
    ).map((el) => {
      const info = accName(el);
      return {
        tag: el.tagName.toLowerCase(),
        type: (el as HTMLInputElement).type ?? null,
        accessibleName: info.name,
        nameSource: info.source,
        required: (el as HTMLInputElement).required ?? false,
      };
    });

    const imagesNoAlt = Array.from(document.querySelectorAll('img')).filter(
      (img) => !img.hasAttribute('alt'),
    ).length;

    const buttonsNoName = Array.from(document.querySelectorAll('button, [role="button"]'))
      .filter((b) => {
        const info = accName(b);
        const text = (b.textContent ?? '').trim();
        return !info.name && !text;
      }).length;

    // Lien d'évitement : 1er élément focusable est-il un lien #contenu ?
    const firstFocusable = document.querySelector(
      'a[href], button, input, [tabindex]:not([tabindex="-1"])',
    );
    const skipLink =
      firstFocusable?.tagName === 'A' &&
      /#|content|contenu|principal|main/i.test(
        (firstFocusable.getAttribute('href') ?? '') + (firstFocusable.textContent ?? ''),
      );

    return {
      headings,
      h1Count: headings.filter((h) => h.level === 1).length,
      landmarks,
      fields,
      fieldsWithoutName: fields.filter((f) => f.nameSource === 'AUCUN').length,
      fieldsPlaceholderOnly: fields.filter((f) => f.nameSource === 'placeholder-only').length,
      imagesNoAlt,
      buttonsNoName,
      skipLink: Boolean(skipLink),
    };
  });
}

const ROUTES: Array<{ name: string; path: string }> = [
  { name: 'accueil', path: '/' },
  { name: 'catalogue', path: '/catalogue' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'forgot-password', path: '/forgot-password' },
  { name: 'reset-password', path: '/reset-password' },
  { name: 'verify-2fa', path: '/verify-2fa' },
  { name: 'cart', path: '/cart' },
  { name: 'checkout', path: '/checkout' },
  { name: '404', path: '/page-inexistante' },
];

for (const route of ROUTES) {
  test(`dom ${route.name}`, async ({ page }) => {
    await page.goto(route.path);
    await settle(page);
    write(route.name, { route: route.path, ...(await inspect(page)) });
    expect(true).toBe(true);
  });
}

// --- Piège de focus : modale produit ---------------------------------------
test('focus-trap modale-produit', async ({ page }) => {
  await page.goto('/catalogue');
  await settle(page);
  const card = page.locator('.cv-pcard .cv-ph.is-clickable').first();
  const result: Record<string, unknown> = { opened: false };
  try {
    await card.click({ timeout: 5000 });
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    result.opened = true;
    // Élément focalisé à l'ouverture.
    result.focusOnOpen = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      inDialog: Boolean(document.activeElement?.closest('[role="dialog"]')),
    }));
    // Tabule et vérifie si le focus quitte la modale.
    let escaped = false;
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const inDialog = await page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      );
      if (!inDialog) {
        escaped = true;
        break;
      }
    }
    result.focusEscapesDialog = escaped;
    // Escape ferme-t-il ?
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    result.escapeCloses = (await page.locator('[role="dialog"]').count()) === 0;
  } catch (e) {
    result.error = String(e);
  }
  write('focus-trap-modale-produit', result);
  expect(true).toBe(true);
});

// --- Piège de focus : chat (admin) -----------------------------------------
test('focus-trap chat', async ({ page, request }) => {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const token = (await res.json()).access_token as string;
  await page.addInitScript((v) => window.localStorage.setItem('access_token', v), token);
  await page.goto('/');
  await settle(page);
  const result: Record<string, unknown> = { opened: false };
  try {
    await page.getByRole('button', { name: /ouvrir le chat/i }).click({ timeout: 5000 });
    await page.waitForTimeout(700);
    result.opened = true;
    result.hasDialogRole = (await page.locator('.chat-modal[role="dialog"]').count()) > 0;
    result.focusOnOpen = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      inModal: Boolean(document.activeElement?.closest('.chat-modal')),
    }));
    let escaped = false;
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const inModal = await page.evaluate(() =>
        Boolean(document.activeElement?.closest('.chat-modal')),
      );
      if (!inModal) {
        escaped = true;
        break;
      }
    }
    result.focusEscapesModal = escaped;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    result.escapeCloses = (await page.locator('.chat-modal').count()) === 0;
  } catch (e) {
    result.error = String(e);
  }
  write('focus-trap-chat', result);
  expect(true).toBe(true);
});
