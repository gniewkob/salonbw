import { useCallback, useEffect, useState } from 'react';

export type ApiFetchFn = <T>(
    endpoint: string,
    init?: RequestInit,
) => Promise<T>;

export interface UseReceptionFetchOptions<TRaw, TData> {
    /**
     * When false the hook short-circuits the fetch and resets `data` to
     * `resetData` (defaults to `initialData`). Caller drives this from
     * `currentView === 'reception'`.
     */
    enabled: boolean;
    /**
     * URL to fetch when enabled. Build it from caller-side state
     * (currentDate, ranges, ids). Use `null` to skip even when enabled.
     */
    buildUrl: () => string | null;
    apiFetch: ApiFetchFn;
    /**
     * Maps the raw response to the consumer-facing shape. Pure function;
     * runs on the resolved promise value.
     */
    normalize: (raw: TRaw) => TData;
    /** Initial value before the first fetch resolves. */
    initialData: TData;
    /**
     * Value when `enabled` is false. Defaults to `initialData`.
     * Useful when "disabled" should clear stale data.
     */
    resetData?: TData;
    /**
     * Extra dependencies that should trigger a re-fetch. Caller passes
     * the variable inputs (currentDate, ranges, retry token).
     */
    deps?: ReadonlyArray<unknown>;
}

export interface UseReceptionFetchResult<TData> {
    loading: boolean;
    error: boolean;
    data: TData;
    refresh: () => void;
}

export function useReceptionFetch<TRaw, TData>(
    options: UseReceptionFetchOptions<TRaw, TData>,
): UseReceptionFetchResult<TData> {
    const {
        enabled,
        buildUrl,
        apiFetch,
        normalize,
        initialData,
        resetData,
        deps = [],
    } = options;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [data, setData] = useState<TData>(initialData);
    const [retryToken, setRetryToken] = useState(0);

    const refresh = useCallback(() => {
        setRetryToken((token) => token + 1);
    }, []);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            setError(false);
            setData(resetData ?? initialData);
            return;
        }

        const url = buildUrl();
        if (url === null) return;

        let cancelled = false;

        setLoading(true);
        setError(false);

        void apiFetch<TRaw>(url)
            .then((raw) => {
                if (cancelled) return;
                setData(normalize(raw));
                setError(false);
            })
            .catch(() => {
                if (cancelled) return;
                setData(resetData ?? initialData);
                setError(true);
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, apiFetch, retryToken, ...deps]);

    return { loading, error, data, refresh };
}
