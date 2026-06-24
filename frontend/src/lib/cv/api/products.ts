import type { Product } from '../types';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE_URL = (rawApiBaseUrl?.trim() || '/api').replace(/\/+$/, '');
const FALLBACK_API_BASE_URLS = ['http://127.0.0.1:8000', 'http://localhost:8000'];

export interface ProductDto {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  url: string | null;
  stock: number;
  price: number | string;
  previous_price: number | string | null;
  likes_count: number;
  created_at: string;
  category: {
    id: number;
    name: string;
  } | null;
}

export interface CategoryDto {
  id: number;
  name: string;
  product_count: number;
}

export interface VoteStatusDto {
  product_id: number;
  likes_count: number;
  liked: boolean;
}

export type ProductSort = 'default' | 'likes' | 'price' | 'new';

export interface ProductQuery {
  categoryId?: number | null;
  search?: string;
  sort?: ProductSort;
  order?: 'asc' | 'desc';
  limit?: number;
  signal?: AbortSignal;
}

function buildProductsPath(query: ProductQuery = {}): string {
  const params = new URLSearchParams();
  if (query.categoryId != null) params.set('category_id', String(query.categoryId));
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.sort && query.sort !== 'default') params.set('sort', query.sort);
  if (query.order) params.set('order', query.order);
  if (query.limit != null) params.set('limit', String(query.limit));
  const qs = params.toString();
  return qs ? `/products/?${qs}` : '/products/';
}

export async function fetchProducts(query: ProductQuery = {}): Promise<ProductDto[]> {
  return fetchFromApi<ProductDto[]>(buildProductsPath(query), { signal: query.signal });
}

export async function fetchProduct(
  productId: number | string,
  signal?: AbortSignal,
): Promise<ProductDto> {
  return fetchFromApi<ProductDto>(`/products/${productId}`, { signal });
}

export async function fetchCategories(signal?: AbortSignal): Promise<CategoryDto[]> {
  return fetchFromApi<CategoryDto[]>('/categories/', { signal });
}

export async function likeProduct(productId: number | string): Promise<VoteStatusDto> {
  const accessToken = getAccessToken();
  return fetchFromApi<VoteStatusDto>(`/products/${productId}/vote`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
}

async function fetchFromApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  let lastError: unknown;
  const baseUrls = rawApiBaseUrl?.trim() ? [API_BASE_URL] : [API_BASE_URL, ...FALLBACK_API_BASE_URLS];

  for (const baseUrl of baseUrls) {
    try {
      const response = await fetch(`${baseUrl}${path}`, init);

      if (!response.ok) {
        throw new Error(`Erreur API ${path} (${response.status})`);
      }

      return response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function getAccessToken(): string | null {
  return localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token');
}

/** Convertit la réponse API en modèle d'affichage utilisé par les ProductCard. */
export function toCardProduct(product: ProductDto): Product {
  const price = Number(product.price);
  const previousPrice = product.previous_price === null ? null : Number(product.previous_price);

  return {
    id: product.id,
    name: product.name,
    category: product.category?.name ?? 'Sans catégorie',
    price: Number.isFinite(price) ? price : 0,
    trend: previousPrice !== null && price < previousPrice ? 'down' : 'up',
    votes: product.likes_count,
    url: product.url,
  };
}
