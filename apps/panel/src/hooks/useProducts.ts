import type { paths } from '@salonbw/api';
import type { Product as LocalProduct, ProductCategory } from '@/types';
import { useList } from './useList';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

type ProductsResponse =
    paths['/products']['get']['responses']['200']['content']['application/json'];
type Product =
    ProductsResponse extends Array<infer Item>
        ? LocalProduct & Item
        : LocalProduct;

export function useProducts() {
    return useList<Product>('/products');
}

export function useProductCategories() {
    const { apiFetch } = useAuth();
    return useQuery<ProductCategory[]>({
        queryKey: ['product-categories'],
        queryFn: async () => {
            const res = (await apiFetch('/products/categories')) as Response;
            if (!res.ok) throw new Error('Failed to fetch product categories');
            return res.json();
        },
    });
}
