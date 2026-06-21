import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import CalendarView from '@/components/calendar/CalendarView';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import AppointmentDrawer from '@/components/calendar/AppointmentDrawer';
import AppointmentQuickModal from '@/components/calendar/AppointmentQuickModal';
import ReceptionView from '@/components/calendar/ReceptionView';
import MobileReceptionListView from '@/components/calendar/MobileReceptionListView';
import MobileReceptionFiltersSheet from '@/components/calendar/MobileReceptionFiltersSheet';
import StaffAppointmentCalendarView from '@/components/calendar/StaffAppointmentCalendarView';
import ClientAppointmentHistoryView from '@/components/calendar/ClientAppointmentHistoryView';
import ReceptionInsightsPanel from '@/components/calendar/ReceptionInsightsPanel';
import ReceptionFollowUpPanel from '@/components/calendar/ReceptionFollowUpPanel';
import ReceptionFollowUpAuditPanel from '@/components/calendar/ReceptionFollowUpAuditPanel';
import TimeBlockModal from '@/components/calendar/TimeBlockModal';
import {
    hasCustomerAlert,
    isPriorityAppointment,
} from '@/components/calendar/receptionUtils';
import {
    configureReceptionTelemetryTransport,
    trackReceptionAction,
} from '@/components/calendar/receptionTelemetry';
import { useAuth } from '@/contexts/AuthContext';
import type {
    Appointment,
    CalendarEvent,
    CalendarView as CalendarViewType,
    TimeBlock,
} from '@/types';
import { toDateParam } from '@/utils/calendarQueryState';
import { useCalendar, useCalendarMutations } from '@/hooks/useCalendar';
import { useReceptionNowTick } from '@/hooks/calendar/useReceptionNowTick';
import { useReceptionFilters } from '@/hooks/calendar/useReceptionFilters';
import { useCalendarUrlSync } from '@/hooks/calendar/useCalendarUrlSync';
import { useReceptionInsights } from '@/hooks/calendar/useReceptionInsights';
import { useReceptionFollowUp } from '@/hooks/calendar/useReceptionFollowUp';
import { useFollowUpAudit } from '@/hooks/calendar/useFollowUpAudit';
import { useCancellationRequests } from '@/hooks/calendar/useCancellationRequests';
import { useActionsAccounting } from '@/hooks/calendar/useActionsAccounting';
import { useAppointmentDrawer } from '@/hooks/calendar/useAppointmentDrawer';
import { useDeepLinkResolver } from '@/hooks/calendar/useDeepLinkResolver';
import { useCustomerAlerts } from '@/hooks/calendar/useCustomerAlerts';
import { useIsMobile } from '@/hooks/useIsMobile';

function CalendarPageShell() {
    return (
        <>
            <Head>
                <title>Kalendarz — Salon Black &amp; White</title>
            </Head>
            <div className="salonbw-page" data-testid="calendar-shell">
                <div className="px-3 pt-3 pb-2">
                    <div
                        className="placeholder-glow small text-muted mb-2"
                        aria-hidden
                    >
                        <span className="placeholder col-2" />
                    </div>
                    <div
                        className="d-flex align-items-center justify-content-between gap-2"
                        aria-hidden
                    >
                        <span className="placeholder col-7" />
                        <span className="placeholder col-2" />
                    </div>
                </div>
                <div className="px-3 pb-3">
                    <div className="border rounded bg-white p-3">
                        <div className="small text-muted mb-2">
                            Initialising calendar engine...
                        </div>
                        <div className="placeholder-glow d-flex flex-column gap-2">
                            <span className="placeholder col-12" />
                            <span className="placeholder col-12" />
                            <span className="placeholder col-8" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function CalendarPage() {
    const router = useRouter();
    const isRouterReady = router.isReady ?? true;
    const { role, user, apiFetch } = useAuth();
    const isMobile = useIsMobile();
    const {
        currentDate,
        currentView,
        employeeMode,
        clientMode,
        employeeArchiveMode,
        selectedEmployeeIds,
        queryStateReady,
        setCurrentDate,
        setCurrentView,
        setEmployeeArchiveMode,
        setSelectedEmployeeIds,
    } = useCalendarUrlSync();
    const {
        statusFilter: receptionStatusFilter,
        paymentFilter: receptionPaymentFilter,
        alertFilter: receptionAlertFilter,
        priorityFilter: receptionPriorityFilter,
        setStatusFilter: setReceptionStatusFilter,
        setPaymentFilter: setReceptionPaymentFilter,
        setAlertFilter: setReceptionAlertFilter,
        setPriorityFilter: setReceptionPriorityFilter,
        resetAll: resetReceptionFilters,
    } = useReceptionFilters();
    const receptionNowTick = useReceptionNowTick(currentView === 'reception');
    const {
        runtimeOnAlertsCount: receptionActionsOnAlertsCount,
        persistedOnAlertsCount: persistedActionsOnAlertsCount,
        persistedTotalCount: persistedActionsTotalCount,
        incrementRuntime: incrementReceptionActionsOnAlerts,
    } = useActionsAccounting({
        enabled: currentView === 'reception',
        currentDate,
        selectedEmployeeIds,
        apiFetch,
    });
    const {
        loading: receptionInsightsLoading,
        error: receptionInsightsError,
        summary: receptionInsightsSummary,
        byAction: receptionInsightsByAction,
        byDay: receptionInsightsByDay,
    } = useReceptionInsights({
        enabled: currentView === 'reception',
        currentDate,
        apiFetch,
    });
    const {
        loading: receptionFollowUpLoading,
        error: receptionFollowUpError,
        candidates: receptionFollowUpCandidates,
        actionStateByKey: receptionFollowUpActionStateByKey,
        captureAction: handleCaptureFollowUpAction,
    } = useReceptionFollowUp({
        enabled: currentView === 'reception',
        currentDate,
        apiFetch,
    });
    const {
        loading: followUpAuditLoading,
        error: followUpAuditError,
        summary: followUpAuditSummary,
    } = useFollowUpAudit({
        enabled: currentView === 'reception',
        currentDate,
        apiFetch,
    });
    const {
        drawer,
        quickModal,
        openForCreate: openDrawerForCreate,
        openForEdit: openDrawerForEdit,
        close: closeDrawer,
        openQuickModal,
        closeQuickModal,
        promoteQuickToEdit: openDrawerFromQuick,
    } = useAppointmentDrawer({
        onClose: () => clearAppointmentDeepLink(),
    });

    const [timeBlockModal, setTimeBlockModal] = useState<{
        open: boolean;
        existingBlock: TimeBlock | null;
        initialStartTime?: Date;
        initialEndTime?: Date;
        initialEmployeeId?: number;
    }>({ open: false, existingBlock: null });

    const { data, loading, refetch } = useCalendar({
        date: toDateParam(currentDate),
        view: currentView,
        employeeIds:
            selectedEmployeeIds.length > 0 ? selectedEmployeeIds : undefined,
        enabled: queryStateReady,
    });
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
    const {
        severityById: customerAlertSeverityById,
        statsError: customerAlertStatsError,
        retry: retryCustomerAlertStats,
    } = useCustomerAlerts({
        enabled: currentView === 'reception' && !clientMode,
        visibleCustomerIds,
        apiFetch,
    });
    const { rescheduleAppointment, checkConflicts } = useCalendarMutations();
    const {
        loading: cancellationRequestsLoading,
        error: cancellationRequestsError,
        requests: cancellationRequests,
        actionStateByAppointmentId:
            cancellationRequestActionStateByAppointmentId,
        cancelRequest: handleCancelFromRequestQueue,
    } = useCancellationRequests({
        enabled: currentView === 'reception',
        apiFetch,
        onAfterCancel: () => {
            void refetch();
        },
    });

    useEffect(() => {
        configureReceptionTelemetryTransport((payload) =>
            apiFetch('/reception/operational-events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }),
        );

        return () => {
            configureReceptionTelemetryTransport(null);
        };
    }, [apiFetch]);

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

    const { error: deepLinkError, clearLink: clearAppointmentDeepLink } =
        useDeepLinkResolver({
            appointmentsById,
            apiFetch,
            onResolved: openDrawerForEdit,
        });

    const handleEventClick = (event: CalendarEvent) => {
        if (event.type === 'time_block') {
            const block: TimeBlock = {
                id: event.id,
                employeeId: event.employeeId ?? 0,
                employeeName: event.employeeName ?? '',
                startTime: event.startTime,
                endTime: event.endTime,
                type: event.blockType ?? 'other',
                title: event.title,
                allDay: event.allDay ?? false,
            };
            setTimeBlockModal({ open: true, existingBlock: block });
            return;
        }
        if (event.type !== 'appointment') return;
        const appointment = appointmentsById.get(event.id);
        trackReceptionAction({
            action: 'open_appointment_drawer',
            appointmentId: event.id,
            customerId: event.clientId ?? appointment?.client?.id ?? null,
            customerAlertSeverity:
                event.customerAlertSeverity ??
                (event.clientId
                    ? customerAlertSeverityById[event.clientId]
                    : undefined),
            source: 'calendar',
        });

        openQuickModal(event, appointment ?? null);
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

    const employeeAppointments = useMemo(() => {
        const list = Array.from(appointmentsById.values());
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const archiveStatuses = new Set(['completed', 'cancelled', 'no_show']);

        return list.filter((appointment) => {
            if (role === 'employee' && user?.id && appointment.employee?.id) {
                if (appointment.employee.id !== user.id) {
                    return false;
                }
            }

            const start = new Date(appointment.startTime);
            const status = appointment.status ?? 'scheduled';
            const isArchived =
                archiveStatuses.has(status) ||
                start.getTime() < todayStart.getTime();

            return employeeArchiveMode ? isArchived : !isArchived;
        });
    }, [appointmentsById, employeeArchiveMode, role, user?.id]);

    const clientAppointments = useMemo(() => {
        const list = Array.from(appointmentsById.values());
        if (role !== 'client' || !user?.id) {
            return [];
        }
        return list.filter((appointment) => appointment.client?.id === user.id);
    }, [appointmentsById, role, user?.id]);

    const clientFutureAppointments = useMemo(() => {
        const now = Date.now();
        const archiveStatuses = new Set(['completed', 'cancelled', 'no_show']);
        return clientAppointments
            .filter((appointment) => {
                const status = appointment.status ?? 'scheduled';
                const startTs = new Date(appointment.startTime).getTime();
                return !archiveStatuses.has(status) && startTs >= now;
            })
            .sort(
                (left, right) =>
                    new Date(left.startTime).getTime() -
                    new Date(right.startTime).getTime(),
            );
    }, [clientAppointments]);

    const clientArchivedAppointments = useMemo(() => {
        const now = Date.now();
        const archiveStatuses = new Set(['completed', 'cancelled', 'no_show']);
        return clientAppointments
            .filter((appointment) => {
                const status = appointment.status ?? 'scheduled';
                const startTs = new Date(appointment.startTime).getTime();
                return archiveStatuses.has(status) || startTs < now;
            })
            .sort(
                (left, right) =>
                    new Date(right.startTime).getTime() -
                    new Date(left.startTime).getTime(),
            );
    }, [clientAppointments]);

    const receptionDailySummary = useMemo(() => {
        const allAppointments = Array.from(appointmentsById.values());
        const toFinalize = allAppointments.filter(
            (appointment) => appointment.status === 'in_progress',
        ).length;
        const noShow = allAppointments.filter(
            (appointment) => appointment.status === 'no_show',
        ).length;
        const withAlert = allAppointments.filter((appointment) =>
            hasCustomerAlert(appointment, customerAlertSeverityById),
        ).length;

        return {
            toFinalize,
            noShow,
            withAlert,
            actionsTotal: persistedActionsTotalCount ?? 0,
            actionsOnAlerts:
                (persistedActionsOnAlertsCount ?? 0) +
                receptionActionsOnAlertsCount,
        };
    }, [
        appointmentsById,
        customerAlertSeverityById,
        persistedActionsOnAlertsCount,
        persistedActionsTotalCount,
        receptionActionsOnAlertsCount,
    ]);

    useEffect(() => {
        if (!isRouterReady) return;
        const param = Array.isArray(router.query.newService)
            ? router.query.newService[0]
            : router.query.newService;
        if (!param) return;
        const serviceId = Number(param);
        if (!Number.isFinite(serviceId) || serviceId <= 0) return;
        openDrawerForCreate({ serviceId });
        const rest = Object.fromEntries(
            Object.entries(router.query).filter(([k]) => k !== 'newService'),
        );
        void router.replace({ query: rest }, undefined, { shallow: true });
    }, [router.query.newService, isRouterReady, router, openDrawerForCreate]);

    useEffect(() => {
        if (!isRouterReady) return;
        const clientIdParam = Array.isArray(router.query.newClient)
            ? router.query.newClient[0]
            : router.query.newClient;
        if (!clientIdParam) return;
        const clientId = Number(clientIdParam);
        if (!Number.isFinite(clientId) || clientId <= 0) return;
        const clientName = Array.isArray(router.query.clientName)
            ? router.query.clientName[0]
            : (router.query.clientName ?? '');
        openDrawerForCreate({ clientId, clientName });
        const rest = Object.fromEntries(
            Object.entries(router.query).filter(
                ([k]) => k !== 'newClient' && k !== 'clientName',
            ),
        );
        void router.replace({ query: rest }, undefined, { shallow: true });
    }, [router.query.newClient, isRouterReady, router, openDrawerForCreate]);

    const updateCalendarQuery = (
        next: Partial<{
            date: string;
            view: CalendarViewType | 'employee' | 'staff' | 'client';
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

        try {
            await rescheduleAppointment.mutateAsync({
                id: eventId,
                startTime: newStart.toISOString(),
                endTime: newEnd.toISOString(),
                employeeId: targetEmployeeId,
            });
        } catch {
            revert?.();
        }
    };

    return (
        <RouteGuard
            permission="nav:calendar"
            loadingFallback={<CalendarPageShell />}
        >
            <SalonShell role={role}>
                <div className="salonbw-page" data-testid="calendar-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_calendar"
                        items={[{ label: 'Kalendarz' }]}
                    />

                    {!employeeMode && !clientMode && (
                        <CalendarHeader
                            date={currentDate}
                            view={currentView}
                            onDateChange={(date) => {
                                setCurrentDate(date);
                                updateCalendarQuery({
                                    date: toDateParam(date),
                                });
                            }}
                            onViewChange={(view) => {
                                setCurrentView(view);
                                updateCalendarQuery({ view });
                            }}
                            onTodayClick={() => {
                                const today = new Date();
                                setCurrentDate(today);
                                updateCalendarQuery({
                                    date: toDateParam(today),
                                });
                            }}
                        />
                    )}

                    <div className="px-3 pb-3">
                        {deepLinkError ? (
                            <div className="alert alert-warning py-2 mb-2">
                                {deepLinkError}
                            </div>
                        ) : null}
                        {(currentView === 'reception' ||
                            (isMobile && !clientMode)) &&
                        !employeeMode ? (
                            <div className="d-flex flex-column gap-3">
                                {isMobile && currentView !== 'reception' ? (
                                    <div
                                        role="note"
                                        style={{
                                            background: '#f8f9fa',
                                            border: '1px solid #e5e7eb',
                                            borderLeft: '3px solid #b4b8be',
                                            borderRadius: 4,
                                            padding: '0.625rem 0.875rem',
                                            margin: '0.75rem 0.75rem 0',
                                            fontSize: '0.8rem',
                                            color: '#4a4a4a',
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        Pokazujemy listę wizyt — pełny widok
                                        siatki kalendarza jest dostępny na
                                        większym ekranie.
                                    </div>
                                ) : null}
                                {customerAlertStatsError ? (
                                    <div className="alert alert-warning py-2 mb-0">
                                        <div>
                                            Część alertów CRM jest chwilowo
                                            niedostępna. Spróbujemy ponownie
                                            przy kolejnym odświeżeniu widoku.
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-outline-warning btn-sm mt-2"
                                            onClick={retryCustomerAlertStats}
                                        >
                                            Ponów teraz
                                        </button>
                                    </div>
                                ) : null}
                                <div
                                    className="row row-cols-2 row-cols-lg-4 g-2 mb-2"
                                    data-testid="reception-daily-summary"
                                >
                                    <div className="col">
                                        <div className="border rounded p-2 h-100">
                                            <div className="small text-muted">
                                                Do finalizacji
                                            </div>
                                            <div className="fw-semibold">
                                                {
                                                    receptionDailySummary.toFinalize
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="border rounded p-2 h-100">
                                            <div className="small text-muted">
                                                No-show
                                            </div>
                                            <div className="fw-semibold">
                                                {receptionDailySummary.noShow}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="border rounded p-2 h-100">
                                            <div className="small text-muted">
                                                Z alertem CRM
                                            </div>
                                            <div className="fw-semibold">
                                                {
                                                    receptionDailySummary.withAlert
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="border rounded p-2 h-100">
                                            <div className="small text-muted">
                                                Akcje na alertach
                                            </div>
                                            <div className="fw-semibold">
                                                {
                                                    receptionDailySummary.actionsOnAlerts
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <ReceptionInsightsPanel
                                    loading={receptionInsightsLoading}
                                    error={receptionInsightsError}
                                    actionsTotal={
                                        receptionInsightsSummary?.actionsTotal ??
                                        null
                                    }
                                    actionsOnAlerts={
                                        receptionInsightsSummary?.actionsOnAlerts ??
                                        null
                                    }
                                    alertActionRate={
                                        receptionInsightsSummary?.alertActionRate ??
                                        null
                                    }
                                    byAction={receptionInsightsByAction}
                                    byDay={receptionInsightsByDay}
                                    onEnablePriorityFilter={() => {
                                        setReceptionPriorityFilter(true);
                                    }}
                                    onEnableAlertFilter={() => {
                                        setReceptionAlertFilter(true);
                                    }}
                                    onShowToFinalize={() => {
                                        setReceptionStatusFilter('in_progress');
                                        setReceptionPaymentFilter(
                                            'to_finalize',
                                        );
                                    }}
                                    isPriorityFilterActive={
                                        receptionPriorityFilter
                                    }
                                    isAlertFilterActive={receptionAlertFilter}
                                    isToFinalizeFilterActive={
                                        receptionStatusFilter ===
                                            'in_progress' &&
                                        receptionPaymentFilter === 'to_finalize'
                                    }
                                />
                                <ReceptionFollowUpPanel
                                    loading={receptionFollowUpLoading}
                                    error={receptionFollowUpError}
                                    candidates={receptionFollowUpCandidates}
                                    actionStateByCandidateKey={
                                        receptionFollowUpActionStateByKey
                                    }
                                    onOpenAppointment={(id) => {
                                        openAppointmentDeepLink(id);
                                    }}
                                    onOpenCustomer={(id) => {
                                        void router.push(`/customers/${id}`);
                                    }}
                                    onCaptureFollowUpAction={
                                        handleCaptureFollowUpAction
                                    }
                                />
                                <ReceptionFollowUpAuditPanel
                                    loading={followUpAuditLoading}
                                    error={followUpAuditError}
                                    actionsTotal={
                                        followUpAuditSummary?.actionsTotal ??
                                        null
                                    }
                                    byAction={
                                        followUpAuditSummary?.byAction ?? []
                                    }
                                    byReason={
                                        followUpAuditSummary?.byReason ?? []
                                    }
                                    byDay={followUpAuditSummary?.byDay ?? []}
                                />
                                <section
                                    className="border rounded bg-white p-3"
                                    data-testid="reception-cancellation-requests"
                                >
                                    <h2 className="h6 mb-2">
                                        Prośby o anulowanie
                                    </h2>
                                    {cancellationRequestsLoading ? (
                                        <div className="small text-muted">
                                            Ładowanie próśb...
                                        </div>
                                    ) : null}
                                    {cancellationRequestsError ? (
                                        <div className="alert alert-warning py-2 mb-0">
                                            Nie udało się pobrać próśb o
                                            anulowanie. Spróbuj odświeżyć widok.
                                        </div>
                                    ) : null}
                                    {!cancellationRequestsLoading &&
                                    !cancellationRequestsError &&
                                    cancellationRequests.length === 0 ? (
                                        <div className="small text-muted">
                                            Brak aktywnych próśb o anulowanie.
                                        </div>
                                    ) : null}
                                    {!cancellationRequestsLoading &&
                                    !cancellationRequestsError &&
                                    cancellationRequests.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-sm align-middle mb-0">
                                                <thead>
                                                    <tr>
                                                        <th scope="col">
                                                            Klient
                                                        </th>
                                                        <th scope="col">
                                                            Termin
                                                        </th>
                                                        <th scope="col">
                                                            Usługa
                                                        </th>
                                                        <th scope="col">
                                                            Powód
                                                        </th>
                                                        <th scope="col">
                                                            Czas zgłoszenia
                                                        </th>
                                                        <th scope="col">
                                                            Akcje
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {cancellationRequests.map(
                                                        (request) => {
                                                            const actionState =
                                                                cancellationRequestActionStateByAppointmentId[
                                                                    request
                                                                        .appointmentId
                                                                ];
                                                            return (
                                                                <tr
                                                                    key={`${request.appointmentId}:${request.requestedAt}`}
                                                                >
                                                                    <td>
                                                                        {request
                                                                            .client
                                                                            ?.name ??
                                                                            'Brak danych'}
                                                                    </td>
                                                                    <td>
                                                                        {request.startTime
                                                                            ? new Date(
                                                                                  request.startTime,
                                                                              ).toLocaleString(
                                                                                  'pl-PL',
                                                                              )
                                                                            : 'Brak danych'}
                                                                    </td>
                                                                    <td>
                                                                        {request
                                                                            .service
                                                                            ?.name ??
                                                                            'Brak danych'}
                                                                    </td>
                                                                    <td>
                                                                        {request.reason ??
                                                                            'Bez powodu'}
                                                                    </td>
                                                                    <td>
                                                                        {request.requestedAt
                                                                            ? new Date(
                                                                                  request.requestedAt,
                                                                              ).toLocaleString(
                                                                                  'pl-PL',
                                                                              )
                                                                            : 'Brak danych'}
                                                                    </td>
                                                                    <td>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-outline-danger btn-sm"
                                                                            disabled={
                                                                                actionState?.status ===
                                                                                'pending'
                                                                            }
                                                                            onClick={() =>
                                                                                handleCancelFromRequestQueue(
                                                                                    request.appointmentId,
                                                                                )
                                                                            }
                                                                        >
                                                                            {actionState?.status ===
                                                                            'pending'
                                                                                ? 'Anulowanie...'
                                                                                : 'Anuluj wizytę'}
                                                                        </button>
                                                                        {actionState?.message ? (
                                                                            <div
                                                                                className={`small mt-1 ${
                                                                                    actionState.status ===
                                                                                    'error'
                                                                                        ? 'text-danger'
                                                                                        : 'text-success'
                                                                                }`}
                                                                            >
                                                                                {
                                                                                    actionState.message
                                                                                }
                                                                            </div>
                                                                        ) : null}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        },
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : null}
                                </section>
                                {isMobile ? (
                                    <MobileReceptionFiltersSheet
                                        statusFilter={receptionStatusFilter}
                                        paymentFilter={receptionPaymentFilter}
                                        alertFilter={receptionAlertFilter}
                                        priorityFilter={receptionPriorityFilter}
                                        setStatusFilter={
                                            setReceptionStatusFilter
                                        }
                                        setPaymentFilter={
                                            setReceptionPaymentFilter
                                        }
                                        setAlertFilter={setReceptionAlertFilter}
                                        setPriorityFilter={
                                            setReceptionPriorityFilter
                                        }
                                        resetAll={resetReceptionFilters}
                                    />
                                ) : null}
                                {!isMobile ? (
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
                                                checked={
                                                    receptionPriorityFilter
                                                }
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
                                ) : null}
                                {isMobile ? (
                                    <MobileReceptionListView
                                        appointments={receptionAppointments}
                                        loading={loading}
                                        customerAlertSeverityByCustomerId={
                                            customerAlertSeverityById
                                        }
                                        onActionTracked={(params) => {
                                            if (!params.customerAlertSeverity)
                                                return;
                                            incrementReceptionActionsOnAlerts();
                                        }}
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
                                ) : (
                                    <ReceptionView
                                        appointments={receptionAppointments}
                                        loading={loading}
                                        customerAlertSeverityByCustomerId={
                                            customerAlertSeverityById
                                        }
                                        onActionTracked={(params) => {
                                            if (!params.customerAlertSeverity)
                                                return;
                                            incrementReceptionActionsOnAlerts();
                                        }}
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
                                )}
                            </div>
                        ) : employeeMode ? (
                            <div className="d-flex flex-column gap-3">
                                <div className="d-flex flex-wrap align-items-end gap-3 rounded border bg-white p-2">
                                    <div>
                                        <label
                                            className="form-label form-label-sm mb-1"
                                            htmlFor="employee-calendar-date"
                                        >
                                            Data
                                        </label>
                                        <input
                                            id="employee-calendar-date"
                                            type="date"
                                            className="form-control form-control-sm"
                                            value={toDateParam(currentDate)}
                                            onChange={(event) => {
                                                const nextDate = new Date(
                                                    `${event.target.value}T00:00:00`,
                                                );
                                                if (
                                                    Number.isNaN(
                                                        nextDate.getTime(),
                                                    )
                                                )
                                                    return;
                                                setCurrentDate(nextDate);
                                                updateCalendarQuery({
                                                    date: toDateParam(nextDate),
                                                    view: 'employee',
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="form-check pb-2">
                                        <input
                                            id="employee-archive-mode"
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={employeeArchiveMode}
                                            onChange={(event) =>
                                                setEmployeeArchiveMode(
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                        <label
                                            className="form-check-label small"
                                            htmlFor="employee-archive-mode"
                                        >
                                            Pokaż archiwalne
                                        </label>
                                    </div>
                                </div>
                                <StaffAppointmentCalendarView
                                    appointments={employeeAppointments}
                                    loading={loading}
                                    readOnly={employeeArchiveMode}
                                    emptyTitle={
                                        employeeArchiveMode
                                            ? 'Brak wizyt archiwalnych.'
                                            : 'Brak wizyt na wybrany dzień'
                                    }
                                    emptyDescription={
                                        employeeArchiveMode
                                            ? 'Wybierz inną datę lub wyłącz tryb archiwum.'
                                            : 'Wybierz inną datę lub dodaj nową wizytę.'
                                    }
                                    onChanged={() => {
                                        void refetch();
                                    }}
                                    onOpenAppointment={(id) => {
                                        openAppointmentDeepLink(id);
                                    }}
                                />
                            </div>
                        ) : clientMode ? (
                            <ClientAppointmentHistoryView
                                currentDateParam={toDateParam(currentDate)}
                                futureAppointments={clientFutureAppointments}
                                archivedAppointments={
                                    clientArchivedAppointments
                                }
                                onDateChange={(nextDate) => {
                                    setCurrentDate(nextDate);
                                    updateCalendarQuery({
                                        date: toDateParam(nextDate),
                                        view: 'client',
                                    });
                                }}
                                onRequestCancellation={async (
                                    appointmentId,
                                ) => {
                                    await apiFetch(
                                        `/appointments/${appointmentId}/cancellation-request`,
                                        {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type':
                                                    'application/json',
                                            },
                                            body: JSON.stringify({}),
                                        },
                                    );
                                }}
                                onAcceptReschedule={async (appointmentId) => {
                                    await apiFetch(
                                        `/appointments/${appointmentId}/status`,
                                        {
                                            method: 'PATCH',
                                            headers: {
                                                'Content-Type':
                                                    'application/json',
                                            },
                                            body: JSON.stringify({
                                                status: 'confirmed',
                                            }),
                                        },
                                    );
                                    void refetch();
                                }}
                            />
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
                                    openDrawerForCreate({
                                        startTime: start,
                                        endTime: end,
                                        employeeId,
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
                            />
                        )}
                    </div>
                </div>

                {/* FAB: floating action button for new appointment (Versum/Booksy style) */}
                {!employeeMode && !clientMode && (
                    <button
                        type="button"
                        aria-label="Nowa wizyta"
                        onClick={() =>
                            openDrawerForCreate({ startTime: new Date() })
                        }
                        style={{
                            position: 'fixed',
                            bottom: 28,
                            right: 28,
                            width: 52,
                            height: 52,
                            borderRadius: '50%',
                            background: '#0d0d0d',
                            color: 'white',
                            border: 'none',
                            fontSize: 26,
                            lineHeight: 1,
                            boxShadow: '0 4px 14px rgba(0,0,0,0.28)',
                            cursor: 'pointer',
                            zIndex: 1040,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        +
                    </button>
                )}

                <AppointmentQuickModal
                    open={quickModal.event !== null}
                    event={quickModal.event}
                    appointment={quickModal.appointment}
                    onClose={closeQuickModal}
                    onOpenFull={openDrawerFromQuick}
                    onChanged={() => void refetch()}
                />

                <AppointmentDrawer
                    open={drawer.open}
                    mode={drawer.mode}
                    appointment={drawer.appointment}
                    initialStartTime={drawer.initialStartTime}
                    initialEndTime={drawer.initialEndTime}
                    initialEmployeeId={drawer.initialEmployeeId}
                    initialServiceId={drawer.initialServiceId}
                    initialClientId={drawer.initialClientId}
                    initialClientName={drawer.initialClientName}
                    onClose={closeDrawer}
                    onSaved={() => {
                        void refetch();
                    }}
                />

                <TimeBlockModal
                    open={timeBlockModal.open}
                    employees={data?.employees ?? []}
                    existingBlock={timeBlockModal.existingBlock}
                    initialStartTime={timeBlockModal.initialStartTime}
                    initialEndTime={timeBlockModal.initialEndTime}
                    initialEmployeeId={timeBlockModal.initialEmployeeId}
                    onClose={() =>
                        setTimeBlockModal((s) => ({ ...s, open: false }))
                    }
                    onSaved={() => {
                        void refetch();
                    }}
                />
            </SalonShell>
        </RouteGuard>
    );
}
