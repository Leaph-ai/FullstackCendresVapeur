export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  trend: 'up' | 'down';
  votes: number;
}

export interface JournalLog {
  type: 'troc' | 'acces' | 'chaudiere' | 'vote' | 'alert';
  text: string;
}

export interface ToxGaugeConfig {
  id: string;
  label: string;
  center: number;
  unit: string;
  warn: number;
  danger: number;
  initialWarn?: boolean;
}

export const PRODUCTS: Product[] = [
  { id: 1, name: 'Engrenage en laiton', category: 'Cuivre brut', price: 12.50, trend: 'down', votes: 71 },
  { id: 2, name: 'Alambic de poche', category: 'Mécanique lourde', price: 89.90, trend: 'up', votes: 188 },
  { id: 3, name: 'Montre à gousset fêlée', category: 'Optique', price: 250.00, trend: 'up', votes: 156 },
];

export const JOURNAL_LOGS: JournalLog[] = [
  { type: 'troc', text: 'Troc validé — Régulateur de pression Mk.III (Cobalt-114)' },
  { type: 'acces', text: 'Nouvel accès accrédité — secteur Pourpre' },
  { type: 'chaudiere', text: 'Maintenance chaudière 3 — pression rétablie à 6.2 bar' },
  { type: 'vote', text: 'Pression populaire — Lentille optique cuivrée +14 votes' },
  { type: 'troc', text: 'Bordereau de troc CV-2026-00492 édité' },
  { type: 'alert', text: 'Pic de soufre contenu — secteur 12 stabilisé' },
  { type: 'acces', text: 'Quart du soir relevé — équipe Rouille en poste' },
  { type: 'chaudiere', text: 'Ravitaillement reçu — quai des soupapes' },
  { type: 'vote', text: 'Manomètre de quart grimpe au classement' },
  { type: 'troc', text: 'Détendeur à soupape échangé contre 54 ⵟ' },
];

export const TOX_GAUGES: ToxGaugeConfig[] = [
  { id: 'soufre', label: 'Soufre', center: 34, unit: 'ppm', warn: 45, danger: 70, initialWarn: true },
  { id: 'monoxyde', label: 'Monoxyde', center: 22, unit: 'ppm', warn: 45, danger: 70 },
  { id: 'particules', label: 'Particules', center: 48, unit: 'µg', warn: 45, danger: 75, initialWarn: true },
  { id: 'pression', label: 'Pression chaudière', center: 40, unit: '%', warn: 70, danger: 88 },
];

export const COLONY_STATS = [
  { id: 'citizens', value: '1 284', label: 'Citoyens actifs', trend: 'up' as const, trendVal: '4%', nixieStep: 1 },
  { id: 'orders', value: '96', label: 'Commandes / jour', trend: 'up' as const, trendVal: '11%', nixieStep: 1 },
  { id: 'copper', value: '42k', label: 'Cuivre en circulation', trend: 'down' as const, trendVal: '2%', nixieStep: 0 },
  { id: 'pressure', value: '6.2', label: 'Pression chaudière (bar)', stable: true, nixieStep: 0 },
];

export const NAV_LINKS = [
  { href: '#vitrine', label: 'Vitrine', id: 'vitrine' },
  { href: '#toxicite', label: 'Toxicité', id: 'toxicite' },
  { href: '#journal', label: 'Journal', id: 'journal' },
  { href: '#chiffres', label: 'Colonie', id: 'chiffres' },
  { href: '#contact', label: 'Contact', id: 'contact' },
  { href: '#footer', label: 'Guilde', id: 'footer' },
];
