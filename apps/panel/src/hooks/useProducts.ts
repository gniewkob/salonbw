import type { paths } from '@salonbw/api';
import type { Product as LocalProduct } from '@/types';
import { useList } from './useList';

// `useProductCategories` lives in `./useWarehouseViews` — it talks to
// `/product-categories/tree`, the actual backend endpoint. An older copy of
// this hook used to hit `/products/categories` (which 404s — the backend
// `ProductsController` has `@Get(':id')` that captures "categories" as an id
// and rejects it) and treated `apiFetch` as if it returned a raw Response.
// Import from `./useWarehouseViews` instead.

type ProductsResponse =
    paths['/products']['get']['responses']['200']['content']['application/json'];
type Product =
    ProductsResponse extends Array<infer Item>
        ? LocalProduct & Item
        : LocalProduct;

export function useProducts() {
    return useList<Product>('/products');
}

export { useProductCategories } from './useWarehouseViews';
