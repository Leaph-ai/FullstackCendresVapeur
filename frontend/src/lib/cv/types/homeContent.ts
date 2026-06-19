export interface Product {
  id: string | number;
  name: string;
  category: string;
  price: number;
  trend: 'up' | 'down';
  votes: number;
  url?: string | null;
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
  {
    id: 'p1',
    name: 'Régulateur de pression Mk.III',
    category: 'Mécanique lourde',
    price: 48,
    trend: 'up',
    votes: 214,
    url: 'https://images.unsplash.com/photo-1516192518150-0d8fee5425e3?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'p2',
    name: "Valve d'appoint laiton",
    category: 'Vapeur',
    price: 31,
    trend: 'down',
    votes: 188,
    url: 'https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'p3',
    name: 'Lentille optique cuivrée',
    category: 'Optique',
    price: 76,
    trend: 'up',
    votes: 156,
    url: 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&w=900&q=80',
  },
  { id: 'p4', name: 'Manomètre de quart', category: 'Mesure', price: 22, trend: 'down', votes: 132 },
  { id: 'p5', name: 'Détendeur à soupape', category: 'Mécanique', price: 54, trend: 'up', votes: 98 },
  { id: 'p6', name: 'Engrenage 14 dents', category: 'Cuivre brut', price: 19, trend: 'down', votes: 71 },
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
  { href: '#footer', label: 'Guilde', id: 'footer' },
];
