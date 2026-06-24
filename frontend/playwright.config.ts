import { defineConfig, devices } from '@playwright/test';

/**
 * Tests end-to-end « Cendres & Vapeur ».
 *
 * Pré-requis : l'API backend doit tourner sur http://127.0.0.1:8000 avec la base
 * peuplée (`cd backend && ./db/db.sh setup && uv run fastapi run app/main.py`).
 * Le serveur Vite (proxy /api → :8000) est démarré automatiquement ci-dessous.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    // Les panneaux à révélation au scroll restent opacité 1 en motion réduit
    // (cf. @media prefers-reduced-motion), ce qui évite toute attente d'animation.
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
