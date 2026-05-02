import { useWarehouseSales } from '@/hooks/useWarehouseViews';

interface UseCustomerLinkedSalesOptions {
    salesPageSize?: number;
}

export function useCustomerLinkedSales(
    customerId: number,
    options: UseCustomerLinkedSalesOptions = {},
) {
    const salesPageSize = options.salesPageSize ?? 5;

    const linkedSalesQuery = useWarehouseSales({
        page: 1,
        pageSize: salesPageSize,
        customerId,
        enabled: Number.isFinite(customerId) && customerId > 0,
    });

    return {
        customerId,
        linkedSalesQuery,
    };
}
