import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { CalendarView as CalendarViewType } from '@/types';
import {
    areIdsEqual,
    deriveCalendarQueryState,
    toDateParam,
} from '@/utils/calendarQueryState';

export interface CalendarViewState {
    currentDate: Date;
    currentView: CalendarViewType;
    employeeMode: boolean;
    clientMode: boolean;
    employeeArchiveMode: boolean;
    selectedEmployeeIds: number[];
    queryStateReady: boolean;
}

export interface CalendarViewActions {
    setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
    setCurrentView: React.Dispatch<React.SetStateAction<CalendarViewType>>;
    setEmployeeMode: React.Dispatch<React.SetStateAction<boolean>>;
    setClientMode: React.Dispatch<React.SetStateAction<boolean>>;
    setEmployeeArchiveMode: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedEmployeeIds: React.Dispatch<React.SetStateAction<number[]>>;
}

export type CalendarUrlSyncHook = CalendarViewState & CalendarViewActions;

export function useCalendarUrlSync(): CalendarUrlSyncHook {
    const router = useRouter();
    const isRouterReady = router.isReady ?? true;
    const initialQueryState = deriveCalendarQueryState(router.query);

    const [currentDate, setCurrentDate] = useState(
        initialQueryState.currentDate,
    );
    const [currentView, setCurrentView] = useState<CalendarViewType>(
        initialQueryState.currentView,
    );
    const [employeeMode, setEmployeeMode] = useState(
        initialQueryState.employeeMode,
    );
    const [clientMode, setClientMode] = useState(initialQueryState.clientMode);
    const [employeeArchiveMode, setEmployeeArchiveMode] = useState(false);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>(
        initialQueryState.selectedEmployeeIds,
    );
    const [queryStateReady, setQueryStateReady] = useState(isRouterReady);

    useEffect(() => {
        if (!isRouterReady) return;
        const next = deriveCalendarQueryState(router.query);
        setCurrentDate((current) =>
            toDateParam(current) === toDateParam(next.currentDate)
                ? current
                : next.currentDate,
        );
        setCurrentView((current) =>
            current === next.currentView ? current : next.currentView,
        );
        setEmployeeMode((current) =>
            current === next.employeeMode ? current : next.employeeMode,
        );
        setClientMode((current) =>
            current === next.clientMode ? current : next.clientMode,
        );
        setSelectedEmployeeIds((current) =>
            areIdsEqual(current, next.selectedEmployeeIds)
                ? current
                : next.selectedEmployeeIds,
        );
        setQueryStateReady(true);
    }, [
        isRouterReady,
        router.query,
        router.query.date,
        router.query.employeeIds,
        router.query.view,
    ]);

    return {
        currentDate,
        currentView,
        employeeMode,
        clientMode,
        employeeArchiveMode,
        selectedEmployeeIds,
        queryStateReady,
        setCurrentDate,
        setCurrentView,
        setEmployeeMode,
        setClientMode,
        setEmployeeArchiveMode,
        setSelectedEmployeeIds,
    };
}
