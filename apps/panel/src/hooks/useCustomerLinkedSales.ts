import { useCustomerEventHistory } from '@/hooks/useCustomers';
import { useWarehouseSales } from '@/hooks/useWarehouseViews';

interface UseCustomerLinkedSalesOptions {
    historyLimit?: number;
    salesPageSize?: number;
}

export function useCustomerLinkedSales(
    customerId: number,
    options: UseCustomerLinkedSalesOptions = {},
) {
    const historyLimit = options.historyLimit ?? 50;
    const salesPageSize = options.salesPageSize ?? 5;

    const { data: completedHistory } = useCustomerEventHistory(customerId, {
        limit: historyLimit,
        status: 'completed',
    });

    const completedAppointmentIdsArray = (
        completedHistory?.items
            .map((item) => item.id)
            .filter((id) => Number.isFinite(id) && id > 0) ?? []
    ).slice(0, historyLimit);

    const completedAppointmentIds = completedAppointmentIdsArray.join(',');

    const linkedSalesQuery = useWarehouseSales({
        page: 1,
        pageSize: salesPageSize,
        appointmentIds:
            completedAppointmentIds.length > 0
                ? completedAppointmentIds
                : undefined,
        enabled: completedAppointmentIds.length > 0,
    });

    return {
        completedAppointmentIds,
        completedAppointmentCount: completedAppointmentIdsArray.length,
        linkedSalesQuery,
    };
}
