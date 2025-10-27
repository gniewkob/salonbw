import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface InventoryItem {
    id: number;
    name: string;
    brand?: string;
    unitPrice: number;
    stock: number;
}

export interface SalesSummary {
    source: 'product_sales' | 'inventory_movements' | 'none';
    from: string;
    to: string;
    units: number;
    revenue: number | null;
}

export function useInventory(threshold = 5) {
    const { apiFetch } = useAuth();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await apiFetch<InventoryItem[]>('/inventory');
                if (mounted) setItems(data);
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : 'Failed to load inventory';
                if (mounted) setError(msg);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        void load();
        return () => {
            mounted = false;
        };
    }, [apiFetch]);

    const lowStock = useMemo(
        () => items.filter((i) => i.stock <= threshold),
        [items, threshold],
    );

    return { items, lowStock, loading, error };
}

export function useSalesSummary(from?: Date, to?: Date) {
    const { apiFetch } = useAuth();
    const [summary, setSummary] = useState<SalesSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const params = new URLSearchParams();
        if (from) params.set('from', from.toISOString());
        if (to) params.set('to', to.toISOString());
        const url = `/sales/summary${params.toString() ? `?${params}` : ''}`;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await apiFetch<SalesSummary>(url);
                if (mounted) setSummary(data);
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : 'Failed to load sales';
                if (mounted) setError(msg);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        void load();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiFetch, from?.toISOString(), to?.toISOString()]);

    return { summary, loading, error };
}
