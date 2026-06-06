import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types';

export function useProductApi() {
    const { apiFetch } = useAuth();

    const mapPayload = <T extends Record<string, unknown>>(data: T) => {
        const minQuantity =
            data.minQuantity ??
            (typeof data.lowStockThreshold === 'number'
                ? data.lowStockThreshold
                : undefined);
        return {
            ...data,
            minQuantity,
        };
    };

    const create = async (data: {
        name: string;
        unitPrice: number;
        stock: number;
        categoryId?: number;
        productType?: string;
        sku?: string;
        unit?: string;
        description?: string;
        lowStockThreshold?: number;
        minQuantity?: number;
        vatRate?: number;
        brand?: string;
    }) => {
        return apiFetch<Product>('/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mapPayload(data)),
        });
    };

    const update = async (
        id: number,
        data: {
            name?: string;
            unitPrice?: number;
            stock?: number;
            lowStockThreshold?: number;
            minQuantity?: number;
            vatRate?: number;
            brand?: string;
        },
    ) => {
        return apiFetch<Product>(`/products/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mapPayload(data)),
        });
    };

    const updateStock = async (id: number, amount: number) => {
        return apiFetch<Product>(`/products/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: amount }),
        });
    };

    const remove = async (id: number) => {
        await apiFetch(`/products/${id}`, { method: 'DELETE' });
    };

    return { create, update, updateStock, remove };
}
