import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Product } from '@/types';

export function useProductApi() {
    const { apiFetch } = useAuth();
    const toast = useToast();

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
        lowStockThreshold?: number;
        minQuantity?: number;
        vatRate?: number;
        brand?: string;
    }) => {
        try {
            const res = await apiFetch<Product>('/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mapPayload(data)),
            });
            toast.success('Product created');
            return res;
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error');
            throw err;
        }
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
        try {
            const res = await apiFetch<Product>(`/products/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mapPayload(data)),
            });
            toast.success('Product updated');
            return res;
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error');
            throw err;
        }
    };

    const updateStock = async (id: number, amount: number) => {
        try {
            const res = await apiFetch<Product>(`/products/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: amount }),
            });
            toast.success('Stock updated');
            return res;
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error');
            throw err;
        }
    };

    const remove = async (id: number) => {
        try {
            await apiFetch(`/products/${id}`, { method: 'DELETE' });
            toast.success('Product deleted');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error');
            throw err;
        }
    };

    return { create, update, updateStock, remove };
}
