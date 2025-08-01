import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Product } from '@/types';

export function useProductApi() {
    const { apiFetch } = useAuth();
    const toast = useToast();

    const create = async (data: {
        name: string;
        unitPrice: number;
        stock: number;
        brand?: string;
    }) => {
        try {
            const res = await apiFetch<Product>('/products/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            toast.success('Product created');
            return res;
        } catch (err: any) {
            toast.error(err.message || 'Error');
            throw err;
        }
    };

    const update = async (
        id: number,
        data: {
            name?: string;
            unitPrice?: number;
            stock?: number;
            brand?: string;
        },
    ) => {
        try {
            const res = await apiFetch<Product>(`/products/admin/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            toast.success('Product updated');
            return res;
        } catch (err: any) {
            toast.error(err.message || 'Error');
            throw err;
        }
    };

    const updateStock = async (id: number, amount: number) => {
        try {
            const res = await apiFetch<Product>(`/products/admin/${id}/stock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount }),
            });
            toast.success('Stock updated');
            return res;
        } catch (err: any) {
            toast.error(err.message || 'Error');
            throw err;
        }
    };

    const remove = async (id: number) => {
        try {
            await apiFetch<void>(`/products/admin/${id}`, { method: 'DELETE' });
            toast.success('Product deleted');
        } catch (err: any) {
            toast.error(err.message || 'Error');
            throw err;
        }
    };

    return { create, update, updateStock, remove };
}
