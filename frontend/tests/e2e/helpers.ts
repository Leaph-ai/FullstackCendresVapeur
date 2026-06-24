import type { APIRequestContext, Page } from '@playwright/test';

const API_BASE = process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:8000';

/**
 * Crée un compte jetable et retourne son JWT d'accès.
 * En environnement dev (APP_ENV=dev), la 2FA est désactivée : le login
 * renvoie directement un access_token.
 */
export async function registerAndLogin(
  request: APIRequestContext,
): Promise<{ email: string; token: string }> {
  const email = `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  const password = 'VapeurSecret123';

  const register = await request.post(`${API_BASE}/auth/register`, {
    data: { email, password },
  });
  if (!register.ok()) {
    throw new Error(`Échec inscription e2e (${register.status()}): ${await register.text()}`);
  }

  const login = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password },
  });
  if (!login.ok()) {
    throw new Error(`Échec connexion e2e (${login.status()}): ${await login.text()}`);
  }

  const body = await login.json();
  const token = body.access_token as string | null;
  if (!token) {
    throw new Error(`Aucun access_token renvoyé (2FA active ?): ${JSON.stringify(body)}`);
  }
  return { email, token };
}

/** Injecte le JWT dans le localStorage avant tout chargement de page. */
export async function authenticate(page: Page, token: string): Promise<void> {
  await page.addInitScript((value) => {
    window.localStorage.setItem('access_token', value);
  }, token);
}
