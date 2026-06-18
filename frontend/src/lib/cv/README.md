# @cv — Bibliothèque Cendres & Vapeur

Design system CSS + composants React réutilisables pour les pages steampunk.

## CSS

```css
@import './lib/cv/styles/index.css';   /* tokens, base, cv-*, fx, layout, sections */
@import './lib/cv/styles/overrides.css'; /* optionnel — thème page sombre */
```

### Modules

| Fichier | Contenu |
|---------|---------|
| `tokens.css` | Variables layout (`--rail-w`, cheminée, panneaux) |
| `base.css` | `body`, fond usine |
| `components.css` | Design system `cv-*` (atomes → organismes) |
| `fx.css` | Instruments steampunk, overlays CRT, vapeur |
| `layout/` | Rail, cheminée, shell (topbar + panneaux), footer |
| `sections/` | Hero, vitrine, toxicité, journal, chiffres |
| `responsive.css` | Breakpoints |

## React

```tsx
import {
  SteampunkPageShell,
  HeroSection,
  VitrineSection,
  ScrollPanel,
  usePanelReveal,
  useLiveData,
} from '@cv';
```

### Structure composants

- `primitives/` — ScrollPanel, PanelRig, SparkChart, CogSvg, OverlayFx
- `layout/` — SteampunkPageShell, MachineRail, SteamChimney, Topbar, FooterBoiler
- `sections/` — Hero, Vitrine (+ ProductCard), Toxicity, Journal, Chiffres
- `hooks/` — useScrollRail, usePanelReveal, useLiveData
- `types/` — Product, JournalEntry, GaugeState, données statiques

## Alias Vite / TS

`@cv` → `src/lib/cv`
