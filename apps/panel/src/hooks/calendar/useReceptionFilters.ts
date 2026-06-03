import { useCallback, useState } from 'react';

export interface ReceptionFiltersState {
    statusFilter: string;
    paymentFilter: string;
    alertFilter: boolean;
    priorityFilter: boolean;
}

export interface ReceptionFiltersActions {
    setStatusFilter: (value: string) => void;
    setPaymentFilter: (value: string) => void;
    setAlertFilter: (value: boolean) => void;
    setPriorityFilter: (value: boolean) => void;
    resetAll: () => void;
}

export type ReceptionFiltersHook = ReceptionFiltersState &
    ReceptionFiltersActions;

export function useReceptionFilters(): ReceptionFiltersHook {
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [alertFilter, setAlertFilter] = useState(false);
    const [priorityFilter, setPriorityFilter] = useState(false);

    const resetAll = useCallback(() => {
        setStatusFilter('all');
        setPaymentFilter('all');
        setAlertFilter(false);
        setPriorityFilter(false);
    }, []);

    return {
        statusFilter,
        paymentFilter,
        alertFilter,
        priorityFilter,
        setStatusFilter,
        setPaymentFilter,
        setAlertFilter,
        setPriorityFilter,
        resetAll,
    };
}
