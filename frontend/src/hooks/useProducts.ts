import { useList } from './useList';
import { Product } from '@/types';

export function useProducts() {
  return useList<Product>('/products/admin');
}
