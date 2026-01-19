import type { paths } from '@salonbw/api';
import type { Product as LocalProduct } from '@/types';
import { useList } from './useList';

type ProductsResponse =
    paths['/products']['get']['responses']['200']['content']['application/json'];
type Product =
    ProductsResponse extends Array<infer Item>
        ? LocalProduct & Item
        : LocalProduct;

export function useProducts() {
    return useList<Product>('/products');
}
