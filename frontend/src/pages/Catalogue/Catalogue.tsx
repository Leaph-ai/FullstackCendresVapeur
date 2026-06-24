import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PanelBody,
  PanelHead,
  ProductCard,
  ProductModal,
  ScrollPanel,
  SteampunkPageShell,
} from '@cv';
import type { Product } from '@cv';
import {
  fetchCategories,
  fetchProducts,
  toCardProduct,
} from '@cv/api/products';
import type { CategoryDto, ProductSort } from '@cv/api/products';
import { useCart } from '../../context/CartContext';
import './catalogue.css';

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'default', label: 'Tri par défaut' },
  { value: 'likes', label: 'Plus populaires' },
  { value: 'price', label: 'Prix' },
  { value: 'new', label: 'Nouveautés' },
];

export function Catalogue() {
  const { addItem, getItemCount } = useCart();

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<ProductSort>('default');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);

  const handleAddToCart = useCallback(
    (product: Product) => {
      void addItem({
        id: product.id,
        productId: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
      });
    },
    [addItem],
  );

  // Debounce de la recherche pour ne pas requêter à chaque frappe.
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 280);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    fetchCategories(controller.signal)
      .then(setCategories)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Impossible de charger les catégories.', error);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);

    fetchProducts({
      categoryId: activeCategory,
      search,
      sort,
      order: sort === 'price' ? order : 'desc',
      signal: controller.signal,
    })
      .then((apiProducts) => {
        setProducts(apiProducts.map(toCardProduct));
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Impossible de charger le catalogue.', error);
        setProducts([]);
        setLoadError(true);
        setLoading(false);
      });

    return () => controller.abort();
  }, [activeCategory, search, sort, order]);

  const totalLabel = useMemo(() => {
    if (loading) return 'Chargement…';
    const n = products.length;
    return `${n} pièce${n > 1 ? 's' : ''}`;
  }, [loading, products.length]);

  return (
    <SteampunkPageShell cartCount={getItemCount()} activeSection="catalogue">
      <ScrollPanel id="catalogue" animated={false}>
        <PanelHead
          sector="SECTEUR 01 · COMPTOIR"
          title="Catalogue — toutes les pièces"
          right={<span className="cv-badge">{totalLabel}</span>}
        />
        <PanelBody>
          <div className="catalogue-filters" role="search">
            <input
              type="search"
              className="cv-control catalogue-search"
              placeholder="Rechercher une pièce…"
              value={searchInput}
              aria-label="Rechercher une pièce"
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <div className="catalogue-sort">
              <select
                className="cv-control"
                value={sort}
                aria-label="Trier les pièces"
                onChange={(event) => setSort(event.target.value as ProductSort)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {sort === 'price' && (
                <button
                  type="button"
                  className="cv-btn is-ghost is-sm"
                  aria-label={order === 'asc' ? 'Prix croissant' : 'Prix décroissant'}
                  onClick={() => setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                >
                  {order === 'asc' ? 'Prix ↑' : 'Prix ↓'}
                </button>
              )}
            </div>
          </div>

          <div className="catalogue-cats" role="tablist" aria-label="Catégories">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === null}
              className={`cv-chip${activeCategory === null ? ' is-active' : ''}`}
              onClick={() => setActiveCategory(null)}
            >
              Tout
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === category.id}
                className={`cv-chip${activeCategory === category.id ? ' is-active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
                <span className="cv-chip-count">{category.product_count}</span>
              </button>
            ))}
          </div>

          {loadError ? (
            <p className="cv-note">
              Impossible de charger le catalogue. Vérifie que l'API backend tourne sur le port 8000.
            </p>
          ) : !loading && products.length === 0 ? (
            <p className="cv-note">Aucune pièce ne correspond à ta recherche.</p>
          ) : (
            <div className="home-pgrid catalogue-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onOpenDetail={setDetail}
                />
              ))}
            </div>
          )}
        </PanelBody>
      </ScrollPanel>

      {detail && (
        <ProductModal
          product={detail}
          onClose={() => setDetail(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </SteampunkPageShell>
  );
}

export default Catalogue;
