import { useCallback, useEffect, useRef, useState } from 'react';
import type {
    CustomerStatistics,
    ReceptionAlertSeverity,
    ReceptionAlertSeverityByCustomerId,
} from '@/types';
import type { CustomerStatisticsBatchResponse } from '@/types/calendar-page';
import type { ApiFetchFn } from '@/hooks/calendar/useReceptionFetch';

const FALLBACK_MAX_CUSTOMERS = 5;

type AlertSeverityValue = Exclude<ReceptionAlertSeverity, 'info'> | null;

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

function deriveSeverity(stats: CustomerStatistics): AlertSeverityValue {
    if (stats.noShowVisits >= 2) return 'danger';
    if (stats.noShowVisits > 0) return 'warning';
    return null;
}

export interface CustomerAlertsHook {
    severityById: ReceptionAlertSeverityByCustomerId;
    statsError: boolean;
    retry: () => void;
}

export function useCustomerAlerts(params: {
    enabled: boolean;
    visibleCustomerIds: number[];
    apiFetch: ApiFetchFn;
}): CustomerAlertsHook {
    const { enabled, visibleCustomerIds, apiFetch } = params;

    const isMountedRef = useRef(true);
    const visibleIdsRef = useRef<number[]>([]);
    const cacheRef = useRef<Record<number, AlertSeverityValue>>({});
    const pendingRef = useRef<Set<number>>(new Set());

    const [severityById, setSeverityById] =
        useState<ReceptionAlertSeverityByCustomerId>({});
    const [statsError, setStatsError] = useState(false);
    const [retryToken, setRetryToken] = useState(0);

    useEffect(
        () => () => {
            isMountedRef.current = false;
        },
        [],
    );

    useEffect(() => {
        visibleIdsRef.current = visibleCustomerIds;
    }, [visibleCustomerIds]);

    useEffect(() => {
        if (!enabled) {
            setStatsError(false);
            setSeverityById((current) =>
                Object.keys(current).length === 0 ? current : {},
            );
            return;
        }
        if (visibleCustomerIds.length === 0) {
            setStatsError(false);
            setSeverityById((current) =>
                Object.keys(current).length === 0 ? current : {},
            );
            return;
        }

        const currentFromCache: ReceptionAlertSeverityByCustomerId = {};
        const missingCustomerIds: number[] = [];

        for (const customerId of visibleCustomerIds) {
            if (customerId in cacheRef.current) {
                const cached = cacheRef.current[customerId];
                if (cached) currentFromCache[customerId] = cached;
            } else if (!pendingRef.current.has(customerId)) {
                missingCustomerIds.push(customerId);
            }
        }

        setSeverityById((current) =>
            areAlertMapsEqual(current, currentFromCache)
                ? current
                : currentFromCache,
        );
        if (missingCustomerIds.length === 0) {
            setStatsError(false);
            return;
        }

        for (const customerId of missingCustomerIds) {
            pendingRef.current.add(customerId);
        }

        // If the batch endpoint fails we fall back to per-customer GETs.
        // Cap the fallback so a persistent batch failure can't fan out to
        // N requests per render — above the cap we mark missing customers
        // failed and let the user hit "retry".
        const fetchPerCustomerFallback = async () =>
            Promise.all(
                missingCustomerIds.map(async (customerId) => {
                    try {
                        const stats = await apiFetch<CustomerStatistics>(
                            `/customers/${customerId}/statistics`,
                        );
                        return {
                            customerId,
                            severity: deriveSeverity(stats),
                            success: true as const,
                        };
                    } catch {
                        return {
                            customerId,
                            severity: null,
                            success: false as const,
                        };
                    }
                }),
            );

        const fetchMissingCustomerStats = async () => {
            try {
                const queryParams = new URLSearchParams();
                queryParams.set('ids', missingCustomerIds.join(','));
                queryParams.set('scope', 'alerts');
                const query = queryParams.toString();
                const response =
                    await apiFetch<CustomerStatisticsBatchResponse>(
                        `/customers/statistics/batch${
                            query ? `?${query}` : ''
                        }`,
                    );

                if (!response || !Array.isArray(response.items)) {
                    throw new Error('Invalid batch response');
                }

                const itemsByCustomerId = new Map<
                    number,
                    CustomerStatistics | null
                >();
                for (const item of response.items) {
                    if (
                        item &&
                        Number.isInteger(item.customerId) &&
                        item.customerId > 0
                    ) {
                        itemsByCustomerId.set(item.customerId, item.statistics);
                    }
                }

                return missingCustomerIds.map((customerId) => {
                    const stats = itemsByCustomerId.get(customerId);
                    if (!stats) {
                        return {
                            customerId,
                            severity: null,
                            success: false as const,
                        };
                    }
                    return {
                        customerId,
                        severity: deriveSeverity(stats),
                        success: true as const,
                    };
                });
            } catch {
                if (missingCustomerIds.length > FALLBACK_MAX_CUSTOMERS) {
                    return missingCustomerIds.map((customerId) => ({
                        customerId,
                        severity: null,
                        success: false as const,
                    }));
                }
                return await fetchPerCustomerFallback();
            } finally {
                for (const customerId of missingCustomerIds) {
                    pendingRef.current.delete(customerId);
                }
            }
        };

        void fetchMissingCustomerStats().then((entries) => {
            let hasFailures = false;
            const failedCustomerIds: number[] = [];
            for (const entry of entries) {
                if (entry.success) {
                    cacheRef.current[entry.customerId] = entry.severity;
                } else {
                    hasFailures = true;
                    failedCustomerIds.push(entry.customerId);
                }
            }

            if (hasFailures) {
                console.warn('[calendar] customer alert stats fetch failed', {
                    failedCustomerIds,
                    failedCount: failedCustomerIds.length,
                });
            }

            const nextVisible: ReceptionAlertSeverityByCustomerId = {};
            for (const customerId of visibleIdsRef.current) {
                const cached = cacheRef.current[customerId];
                if (cached) nextVisible[customerId] = cached;
            }
            if (!isMountedRef.current) return;
            setStatsError(hasFailures);
            setSeverityById((current) =>
                areAlertMapsEqual(current, nextVisible) ? current : nextVisible,
            );
        });
    }, [enabled, visibleCustomerIds, apiFetch, retryToken]);

    const retry = useCallback(() => {
        const nextCache = { ...cacheRef.current };
        for (const customerId of visibleIdsRef.current) {
            delete nextCache[customerId];
        }
        cacheRef.current = nextCache;
        pendingRef.current.clear();
        setStatsError(false);
        setSeverityById((current) =>
            Object.keys(current).length === 0 ? current : {},
        );
        setRetryToken((current) => current + 1);
    }, []);

    return {
        severityById,
        statsError,
        retry,
    };
}
