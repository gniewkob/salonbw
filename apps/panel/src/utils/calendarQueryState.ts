import type { ParsedUrlQuery } from 'querystring';
import type { CalendarQueryState } from '@/types/calendar-page';

export function toDateParam(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function getFirstQueryValue(
    value: string | string[] | undefined,
): string | undefined {
    return Array.isArray(value) ? value[0] : value;
}

export function parseEmployeeIdsParam(
    value: string | string[] | undefined,
): number[] {
    const idsParam = getFirstQueryValue(value);
    if (!idsParam) return [];
    return idsParam
        .split(',')
        .map((entry) => Number(entry))
        .filter((entry) => Number.isInteger(entry) && entry > 0);
}

export function deriveCalendarQueryState(
    query: ParsedUrlQuery,
): CalendarQueryState {
    const dateParam = getFirstQueryValue(query.date);
    const parsedDate = dateParam ? new Date(dateParam) : null;
    const currentDate =
        parsedDate && !Number.isNaN(parsedDate.getTime())
            ? parsedDate
            : new Date();

    const viewParam = getFirstQueryValue(query.view);
    if (viewParam === 'client') {
        return {
            currentDate,
            currentView: 'month',
            employeeMode: false,
            clientMode: true,
            selectedEmployeeIds: parseEmployeeIdsParam(query.employeeIds),
        };
    }
    if (viewParam === 'employee' || viewParam === 'staff') {
        return {
            currentDate,
            currentView: 'day',
            employeeMode: true,
            clientMode: false,
            selectedEmployeeIds: parseEmployeeIdsParam(query.employeeIds),
        };
    }
    if (
        viewParam === 'day' ||
        viewParam === 'week' ||
        viewParam === 'month' ||
        viewParam === 'reception'
    ) {
        return {
            currentDate,
            currentView: viewParam,
            employeeMode: false,
            clientMode: false,
            selectedEmployeeIds: parseEmployeeIdsParam(query.employeeIds),
        };
    }

    return {
        currentDate,
        currentView: 'day',
        employeeMode: false,
        clientMode: false,
        selectedEmployeeIds: parseEmployeeIdsParam(query.employeeIds),
    };
}

export function areIdsEqual(left: number[], right: number[]): boolean {
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; index += 1) {
        if (left[index] !== right[index]) return false;
    }
    return true;
}
