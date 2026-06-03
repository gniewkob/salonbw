import { useCallback, useState } from 'react';
import type { Appointment, CalendarEvent } from '@/types';
import type { DrawerState } from '@/types/calendar-page';

export interface QuickModalState {
    event: CalendarEvent | null;
    appointment: Appointment | null;
}

export interface OpenForCreateOptions {
    startTime?: Date;
    endTime?: Date;
    employeeId?: number;
    serviceId?: number;
    clientId?: number;
    clientName?: string;
}

export interface AppointmentDrawerHook {
    drawer: DrawerState;
    quickModal: QuickModalState;
    openForCreate: (options?: OpenForCreateOptions) => void;
    openForEdit: (appointment: Appointment | null) => void;
    close: () => void;
    openQuickModal: (
        event: CalendarEvent,
        appointment: Appointment | null,
    ) => void;
    closeQuickModal: () => void;
    promoteQuickToEdit: () => void;
}

const INITIAL_DRAWER: DrawerState = {
    open: false,
    mode: 'create',
    appointment: null,
};

const INITIAL_QUICK_MODAL: QuickModalState = {
    event: null,
    appointment: null,
};

export function useAppointmentDrawer(params?: {
    onClose?: () => void;
}): AppointmentDrawerHook {
    const onClose = params?.onClose;

    const [drawer, setDrawer] = useState<DrawerState>(INITIAL_DRAWER);
    const [quickModal, setQuickModal] =
        useState<QuickModalState>(INITIAL_QUICK_MODAL);

    const openForCreate = useCallback((options?: OpenForCreateOptions) => {
        setDrawer({
            open: true,
            mode: 'create',
            appointment: null,
            initialStartTime: options?.startTime,
            initialEndTime: options?.endTime,
            initialEmployeeId: options?.employeeId,
            initialServiceId: options?.serviceId,
            initialClientId: options?.clientId,
            initialClientName: options?.clientName,
        });
    }, []);

    const openForEdit = useCallback((appointment: Appointment | null) => {
        setDrawer({
            open: true,
            mode: 'edit',
            appointment,
        });
    }, []);

    const close = useCallback(() => {
        onClose?.();
        setDrawer((current) => ({ ...current, open: false }));
    }, [onClose]);

    const openQuickModal = useCallback(
        (event: CalendarEvent, appointment: Appointment | null) => {
            setQuickModal({ event, appointment });
        },
        [],
    );

    const closeQuickModal = useCallback(() => {
        setQuickModal(INITIAL_QUICK_MODAL);
    }, []);

    const promoteQuickToEdit = useCallback(() => {
        setQuickModal((current) => {
            if (!current.event) return current;
            setDrawer({
                open: true,
                mode: 'edit',
                appointment: current.appointment ?? null,
            });
            return INITIAL_QUICK_MODAL;
        });
    }, []);

    return {
        drawer,
        quickModal,
        openForCreate,
        openForEdit,
        close,
        openQuickModal,
        closeQuickModal,
        promoteQuickToEdit,
    };
}
