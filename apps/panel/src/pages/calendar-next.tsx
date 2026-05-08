import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import CalendarView from '@/components/calendar/CalendarView';
import AppointmentDrawer from '@/components/calendar/AppointmentDrawer';
import ReceptionView from '@/components/calendar/ReceptionView';
import {
    hasCustomerAlert,
    isOverdueAppointmentAt,
    isPriorityAppointment,
} from '@/components/calendar/receptionUtils';
import { useAuth } from '@/contexts/AuthContext';
import type {
    Appointment,
    CalendarEvent,
    CalendarView as CalendarViewType,
    CustomerStatistics,
    ReceptionAlertSeverity,
    ReceptionAlertSeverityByCustomerId,
} from '@/types';
import { useCalendar, useCalendarMutations } from '@/hooks/useCalendar';

interface DrawerState {
    open: boolean;
    mode: 'create' | 'edit';
    appointment: Appointment | null;
    initialStartTime?: Date;
    initialEndTime?: Date;
    initialEmployeeId?: number;
}

function toDateParam(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function areAlertMapsEqual(
    left: ReceptionAlertSeverityByCustomerId,
    right: ReceptionAlertSeverityByCustomerId,
): boolean {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    for (const key of leftKeys) {
        if (left[Number(key)] !== right[Number(key)]) return false;
    }
    return true;
}

export default function CalendarNextPage() {
    const router = useRouter();
    const { role, apiFetch } = useAuth();
    const isMountedRef = useRef(true);
    const visibleCustomerIdsRef = useRef<number[]>([]);
    const handledDeepLinkAppointmentIdRef = useRef<number | null>(null);
    const customerAlertCacheRef = useRef<
        Record<number, Exclude<ReceptionAlertSeverity, 'info'> | null>
    >({});
    const pendingCustomerAlertFetchesRef = useRef<Set<number>>(new Set());
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<CalendarViewType>('day');
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>(
        [],
    );
    const [customerAlertSeverityById, setCustomerAlertSeverityById] =
        useState<ReceptionAlertSeverityByCustomerId>({});
    const [receptionStatusFilter, setReceptionStatusFilter] = useState('all');
    const [receptionPaymentFilter, setReceptionPaymentFilter] = useState('all');
    const [receptionAlertFilter, setReceptionAlertFilter] = useState(false);
    const [receptionPriorityFilter, setReceptionPriorityFilter] =
        useState(false);
    const [receptionNowTick, setReceptionNowTick] = useState(() => Date.now());
    const [drawer, setDrawer] = useState<DrawerState>({
        open: false,
        mode: 'create',
        appointment: null,
    });

    useEffect(
        () => () => {
            isMountedRef.current = false;
        },
        [],
    );

    const { data, loading, refetch } = useCalendar({
        date: toDateParam(currentDate),
        view: currentView,
        employeeIds:
            selectedEmployeeIds.length > 0 ? selectedEmployeeIds : undefined,
    });
    const { rescheduleAppointment, checkConflicts } = useCalendarMutations();

    const appointmentsById = useMemo(() => {
        const map = new Map<number, Appointment>();
        for (const event of data?.events ?? []) {
            if (event.type !== 'appointment') continue;
            map.set(event.id, {
                id: event.id,
                startTime: event.startTime,
                endTime: event.endTime,
                status: event.status as Appointment['status'],
                client: event.clientId
                    ? { id: event.clientId, name: event.clientName ?? '-' }
                    : undefined,
                service: event.serviceId
                    ? {
                          id: event.serviceId,
                          name: event.serviceName ?? '-',
                          duration: 0,
                          price: 0,
                          priceType: 'fixed',
                          isActive: true,
                          onlineBooking: false,
                          sortOrder: 0,
                      }
                    : undefined,
                employee:
                    event.employeeId > 0
                        ? {
                              id: event.employeeId,
                              name: event.employeeName,
                          }
                        : undefined,
            });
        }
        return map;
    }, [data?.events]);

    const handleEventClick = (event: CalendarEvent) => {
        if (event.type !== 'appointment') return;
        const appointment = appointmentsById.get(event.id);

        setDrawer({
            open: true,
            mode: 'edit',
            appointment: appointment ?? null,
        });
    };

    const receptionAppointments = useMemo(() => {
        const list = Array.from(appointmentsById.values());
        const now = new Date(receptionNowTick);

        return list.filter((appointment) => {
            const status = appointment.status ?? 'scheduled';
            const paymentStatus = appointment.paymentStatus ?? 'unpaid';
            const hasAlert = hasCustomerAlert(
                appointment,
                customerAlertSeverityById,
            );
            const isPriority = isPriorityAppointment(
                appointment,
                now,
                customerAlertSeverityById,
            );

            if (
                receptionStatusFilter !== 'all' &&
                status !== receptionStatusFilter
            ) {
                return false;
            }

            if (
                receptionPaymentFilter === 'unpaid' &&
                paymentStatus === 'paid'
            ) {
                return false;
            }

            if (
                receptionPaymentFilter === 'to_finalize' &&
                status !== 'in_progress'
            ) {
                return false;
            }

            if (receptionAlertFilter && !hasAlert) {
                return false;
            }

            if (receptionPriorityFilter && !isPriority) {
                return false;
            }

            return true;
        });
    }, [
        appointmentsById,
        customerAlertSeverityById,
        receptionStatusFilter,
        receptionPaymentFilter,
        receptionAlertFilter,
        receptionPriorityFilter,
        receptionNowTick,
    ]);

    useEffect(() => {
        if (currentView !== 'reception') return;

        const timerId = window.setInterval(() => {
            setReceptionNowTick(Date.now());
        }, 60_000);

        return () => {
            window.clearInterval(timerId);
        };
    }, [currentView]);

    useEffect(() => {
        const dateParam = Array.isArray(router.query.date)
            ? router.query.date[0]
            : router.query.date;
        if (!dateParam) return;
        const nextDate = new Date(dateParam);
        if (!Number.isNaN(nextDate.getTime())) {
            setCurrentDate(nextDate);
        }
    }, [router.query.date]);

    useEffect(() => {
        const idsParam = Array.isArray(router.query.employeeIds)
            ? router.query.employeeIds[0]
            : router.query.employeeIds;
        if (!idsParam) {
            setSelectedEmployeeIds([]);
            return;
        }
        const parsed = idsParam
            .split(',')
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0);
        setSelectedEmployeeIds(parsed);
    }, [router.query.employeeIds]);

    useEffect(() => {
        const viewParam = Array.isArray(router.query.view)
            ? router.query.view[0]
            : router.query.view;
        if (
            viewParam === 'day' ||
            viewParam === 'week' ||
            viewParam === 'month' ||
            viewParam === 'reception'
        ) {
            setCurrentView(viewParam);
        }
    }, [router.query.view]);

    useEffect(() => {
        const appointmentIdParam = Array.isArray(router.query.appointmentId)
            ? router.query.appointmentId[0]
            : router.query.appointmentId;
        if (!appointmentIdParam) {
            handledDeepLinkAppointmentIdRef.current = null;
            return;
        }

        const appointmentId = Number(appointmentIdParam);
        if (!Number.isFinite(appointmentId) || appointmentId <= 0) return;
        if (handledDeepLinkAppointmentIdRef.current === appointmentId) return;

        const appointmentFromCalendar = appointmentsById.get(appointmentId);
        if (appointmentFromCalendar) {
            setDrawer({
                open: true,
                mode: 'edit',
                appointment: appointmentFromCalendar,
            });
            handledDeepLinkAppointmentIdRef.current = appointmentId;
            return;
        }

        let cancelled = false;

        void apiFetch<Appointment>(`/appointments/${appointmentId}`)
            .then((appointment) => {
                if (cancelled) return;
                setDrawer({
                    open: true,
                    mode: 'edit',
                    appointment,
                });
                handledDeepLinkAppointmentIdRef.current = appointmentId;
            })
            .catch(() => {
                // Ignore deep-link fetch errors and keep calendar usable.
            });

        return () => {
            cancelled = true;
        };
    }, [router.query.appointmentId, appointmentsById, apiFetch]);

    const visibleCustomerIds = useMemo(
        () =>
            Array.from(
                new Set(
                    (data?.events ?? [])
                        .filter(
                            (event) =>
                                event.type === 'appointment' &&
                                Number(event.clientId) > 0,
                        )
                        .map((event) => Number(event.clientId)),
                ),
            ),
        [data?.events],
    );

    useEffect(() => {
        visibleCustomerIdsRef.current = visibleCustomerIds;
    }, [visibleCustomerIds]);

    useEffect(() => {
        if (visibleCustomerIds.length === 0) {
            setCustomerAlertSeverityById((current) =>
                Object.keys(current).length === 0 ? current : {},
            );
            return;
        }

        const currentFromCache: ReceptionAlertSeverityByCustomerId = {};
        const missingCustomerIds: number[] = [];

        for (const customerId of visibleCustomerIds) {
            if (customerId in customerAlertCacheRef.current) {
                const cached = customerAlertCacheRef.current[customerId];
                if (cached) currentFromCache[customerId] = cached;
            } else {
                if (!pendingCustomerAlertFetchesRef.current.has(customerId)) {
                    missingCustomerIds.push(customerId);
                }
            }
        }

        setCustomerAlertSeverityById((current) =>
            areAlertMapsEqual(current, currentFromCache)
                ? current
                : currentFromCache,
        );
        if (missingCustomerIds.length === 0) return;

        for (const customerId of missingCustomerIds) {
            pendingCustomerAlertFetchesRef.current.add(customerId);
        }

        void Promise.all(
            missingCustomerIds.map(async (customerId) => {
                try {
                    const stats = await apiFetch<CustomerStatistics>(
                        `/customers/${customerId}/statistics`,
                    );
                    const severity =
                        stats.noShowVisits >= 2
                            ? ('danger' as const)
                            : stats.noShowVisits > 0
                              ? ('warning' as const)
                              : null;
                    return { customerId, severity, success: true as const };
                } catch {
                    return {
                        customerId,
                        severity: null,
                        success: false as const,
                    };
                } finally {
                    pendingCustomerAlertFetchesRef.current.delete(customerId);
                }
            }),
        ).then((entries) => {
            for (const entry of entries) {
                if (entry.success) {
                    customerAlertCacheRef.current[entry.customerId] =
                        entry.severity;
                }
            }

            const nextVisible: ReceptionAlertSeverityByCustomerId = {};
            for (const customerId of visibleCustomerIdsRef.current) {
                const cached = customerAlertCacheRef.current[customerId];
                if (cached) nextVisible[customerId] = cached;
            }
            if (!isMountedRef.current) return;
            setCustomerAlertSeverityById((current) =>
                areAlertMapsEqual(current, nextVisible) ? current : nextVisible,
            );
        });
    }, [visibleCustomerIds, apiFetch]);

    const updateCalendarQuery = (
        next: Partial<{
            date: string;
            view: CalendarViewType;
            employeeIds: number[];
        }>,
    ) => {
        const query = { ...router.query } as Record<string, string>;
        if (next.date !== undefined) query.date = next.date;
        if (next.view !== undefined) query.view = next.view;
        if (next.employeeIds !== undefined) {
            if (next.employeeIds.length > 0) {
                query.employeeIds = next.employeeIds.join(',');
            } else {
                delete query.employeeIds;
            }
        }
        void router.push({ pathname: router.pathname, query }, undefined, {
            shallow: true,
        });
    };

    const openAppointmentDeepLink = (appointmentId: number) => {
        const query = { ...router.query } as Record<string, string>;
        query.appointmentId = String(appointmentId);
        void router.push({ pathname: router.pathname, query }, undefined, {
            shallow: true,
        });
    };

    const clearAppointmentDeepLink = () => {
        const query = { ...router.query } as Record<string, string>;
        delete query.appointmentId;
        void router.push({ pathname: router.pathname, query }, undefined, {
            shallow: true,
        });
    };

    const handleEventDrop = async (
        eventId: number,
        newStart: Date,
        newEnd: Date,
        newEmployeeId?: number,
        revert?: () => void,
    ) => {
        const event = (data?.events ?? []).find(
            (entry) => entry.id === eventId && entry.type === 'appointment',
        );
        if (!event) return;

        const targetEmployeeId = newEmployeeId ?? event.employeeId;
        const conflictCheck = await checkConflicts(
            targetEmployeeId,
            newStart.toISOString(),
            newEnd.toISOString(),
            eventId,
        );

        if (conflictCheck.hasConflict) {
            revert?.();
            await refetch();
            return;
        }

        await rescheduleAppointment.mutateAsync({
            id: eventId,
            startTime: newStart.toISOString(),
            endTime: newEnd.toISOString(),
            employeeId: targetEmployeeId,
        });
    };

    if (!role) return null;

    return (
        <RouteGuard permission="nav:calendar">
            <SalonShell role={role}>
                <div className="salonbw-page" data-testid="calendar-next-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_calendar"
                        items={[{ label: 'Kalendarz (Next)' }]}
                    />

                    <div className="d-flex align-items-center justify-content-between gap-2 px-3 pb-2">
                        <div className="small text-muted">
                            Natywny kalendarz Booksy-like (beta). Legacy:{' '}
                            <Link href="/calendar">/calendar</Link>
                        </div>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                                setDrawer({
                                    open: true,
                                    mode: 'create',
                                    appointment: null,
                                    initialStartTime: new Date(),
                                })
                            }
                        >
                            Nowa wizyta
                        </button>
                    </div>

                    <div className="px-3 pb-3">
                        {currentView === 'reception' ? (
                            <div className="d-flex flex-column gap-3">
                                <div className="d-flex flex-wrap align-items-end gap-2 rounded border bg-white p-2">
                                    <div>
                                        <label
                                            className="form-label form-label-sm mb-1"
                                            htmlFor="reception-status-filter"
                                        >
                                            Status
                                        </label>
                                        <select
                                            id="reception-status-filter"
                                            className="form-select form-select-sm"
                                            value={receptionStatusFilter}
                                            onChange={(event) =>
                                                setReceptionStatusFilter(
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            <option value="all">
                                                Wszystkie
                                            </option>
                                            <option value="scheduled">
                                                Zaplanowane
                                            </option>
                                            <option value="confirmed">
                                                Potwierdzone
                                            </option>
                                            <option value="in_progress">
                                                W trakcie
                                            </option>
                                            <option value="completed">
                                                Zakończone
                                            </option>
                                            <option value="cancelled">
                                                Anulowane
                                            </option>
                                            <option value="no_show">
                                                No-show
                                            </option>
                                        </select>
                                    </div>
                                    <div>
                                        <label
                                            className="form-label form-label-sm mb-1"
                                            htmlFor="reception-payment-filter"
                                        >
                                            Płatność
                                        </label>
                                        <select
                                            id="reception-payment-filter"
                                            className="form-select form-select-sm"
                                            value={receptionPaymentFilter}
                                            onChange={(event) =>
                                                setReceptionPaymentFilter(
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            <option value="all">
                                                Wszystkie
                                            </option>
                                            <option value="unpaid">
                                                Nieopłacone
                                            </option>
                                            <option value="to_finalize">
                                                Do finalizacji
                                            </option>
                                        </select>
                                    </div>
                                    <div className="form-check pb-2">
                                        <input
                                            id="reception-alert-filter"
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={receptionAlertFilter}
                                            onChange={(event) =>
                                                setReceptionAlertFilter(
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                        <label
                                            className="form-check-label small"
                                            htmlFor="reception-alert-filter"
                                        >
                                            Tylko z alertem CRM
                                        </label>
                                    </div>
                                    <div className="form-check pb-2">
                                        <input
                                            id="reception-priority-filter"
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={receptionPriorityFilter}
                                            onChange={(event) =>
                                                setReceptionPriorityFilter(
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                        <label
                                            className="form-check-label small"
                                            htmlFor="reception-priority-filter"
                                        >
                                            Tylko priorytetowe
                                        </label>
                                    </div>
                                </div>
                                <ReceptionView
                                    appointments={receptionAppointments}
                                    loading={loading}
                                    customerAlertSeverityByCustomerId={
                                        customerAlertSeverityById
                                    }
                                    onChanged={() => {
                                        void refetch();
                                    }}
                                    onOpenFinalizeAppointment={(id) => {
                                        openAppointmentDeepLink(id);
                                    }}
                                    onOpenAppointment={(id) => {
                                        openAppointmentDeepLink(id);
                                    }}
                                />
                            </div>
                        ) : (
                            <CalendarView
                                events={data?.events ?? []}
                                employees={data?.employees ?? []}
                                customerAlertSeverityById={
                                    customerAlertSeverityById
                                }
                                loading={loading}
                                onEventClick={handleEventClick}
                                onEventDrop={handleEventDrop}
                                onDateSelect={(start, end, employeeId) =>
                                    setDrawer({
                                        open: true,
                                        mode: 'create',
                                        appointment: null,
                                        initialStartTime: start,
                                        initialEndTime: end,
                                        initialEmployeeId: employeeId,
                                    })
                                }
                                onViewChange={(nextView) => {
                                    setCurrentView(nextView);
                                    updateCalendarQuery({ view: nextView });
                                }}
                                onEmployeeFilterChange={(ids) => {
                                    setSelectedEmployeeIds(ids);
                                    updateCalendarQuery({ employeeIds: ids });
                                }}
                                onDateChange={(date) => {
                                    setCurrentDate(date);
                                    updateCalendarQuery({
                                        date: toDateParam(date),
                                    });
                                }}
                                currentDate={currentDate}
                                currentView={currentView}
                                selectedEmployeeIds={selectedEmployeeIds}
                                hideSidebar
                            />
                        )}
                    </div>
                </div>

                <AppointmentDrawer
                    open={drawer.open}
                    mode={drawer.mode}
                    appointment={drawer.appointment}
                    initialStartTime={drawer.initialStartTime}
                    initialEndTime={drawer.initialEndTime}
                    initialEmployeeId={drawer.initialEmployeeId}
                    onClose={() => {
                        clearAppointmentDeepLink();
                        setDrawer((current) => ({
                            ...current,
                            open: false,
                        }));
                    }}
                    onSaved={() => {
                        void refetch();
                    }}
                />
            </SalonShell>
        </RouteGuard>
    );
}
