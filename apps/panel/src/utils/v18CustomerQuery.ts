import type { CustomerFilterParams, PaginatedCustomers } from '@/types';

// The backend explicitly allows these sortable fields. In particular,
// lastVisitDate is NOT supported and silently falls back to name.
export type V18CustomerSortField = 'name' | 'email' | 'createdAt';
export type V18CustomerSortOrder = 'ASC' | 'DESC';
export type V18CustomerQuickFilter =
    | ''
    | 'upcoming'
    | 'inactive6m'
    | 'new'
    | 'noEmailConsent'
    | 'noSmsConsent'
    | 'offline';

export type V18CustomerGender = NonNullable<CustomerFilterParams['gender']>;
export type V18CustomerNumberFilter =
    | 'ageMin'
    | 'ageMax'
    | 'spentMin'
    | 'spentMax';

export type V18CustomerQuery = {
    search: string;
    groupId?: number;
    tagId?: number;
    gender?: V18CustomerGender;
    ageMin?: number;
    ageMax?: number;
    spentMin?: number;
    spentMax?: number;
    quickFilter: V18CustomerQuickFilter;
    page: number;
    pageSize: 20 | 50 | 100;
    sortBy: V18CustomerSortField;
    sortOrder: V18CustomerSortOrder;
};

export type V18CustomerQueryAction =
    | { type: 'search'; value: string }
    | { type: 'group'; groupId?: number }
    | { type: 'tag'; tagId?: number }
    | { type: 'advancedGender'; value?: V18CustomerGender }
    | { type: 'advancedNumber'; field: V18CustomerNumberFilter; value?: number }
    | { type: 'quickFilter'; value: V18CustomerQuickFilter }
    | { type: 'sort'; field: V18CustomerSortField }
    | { type: 'pageSize'; value: number }
    | { type: 'page'; value: number; totalPages: number }
    | { type: 'reset' };

export const initialV18CustomerQuery: V18CustomerQuery = {
    search: '',
    quickFilter: '',
    page: 1,
    pageSize: 20,
    sortBy: 'name',
    sortOrder: 'ASC',
};

const positiveInt = (value: number, fallback: number): number =>
    Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback;

export function clampV18CustomerPage(
    requestedPage: number,
    totalPages: number,
): number {
    const lastPage = positiveInt(totalPages, 1);
    return Math.min(positiveInt(requestedPage, 1), lastPage);
}

export function reduceV18CustomerQuery(
    state: V18CustomerQuery,
    action: V18CustomerQueryAction,
): V18CustomerQuery {
    switch (action.type) {
        case 'search':
            return { ...state, search: action.value, page: 1 };
        case 'group':
            return {
                ...state,
                groupId:
                    action.groupId !== undefined &&
                    Number.isSafeInteger(action.groupId) &&
                    action.groupId > 0
                        ? action.groupId
                        : undefined,
                page: 1,
            };
        case 'tag':
            return {
                ...state,
                tagId:
                    action.tagId !== undefined &&
                    Number.isSafeInteger(action.tagId) &&
                    action.tagId > 0
                        ? action.tagId
                        : undefined,
                page: 1,
            };
        case 'advancedGender':
            return {
                ...state,
                gender:
                    action.value === 'female' ||
                    action.value === 'male' ||
                    action.value === 'other'
                        ? action.value
                        : undefined,
                page: 1,
            };
        case 'advancedNumber': {
            const value = action.value;
            const ageField =
                action.field === 'ageMin' || action.field === 'ageMax';
            const valid =
                value !== undefined &&
                Number.isFinite(value) &&
                value >= 0 &&
                (!ageField || (Number.isInteger(value) && value <= 150));
            return {
                ...state,
                [action.field]: valid ? value : undefined,
                page: 1,
            };
        }
        case 'quickFilter':
            return {
                ...state,
                quickFilter:
                    state.quickFilter === action.value ? '' : action.value,
                page: 1,
            };
        case 'sort':
            return {
                ...state,
                sortBy: action.field,
                sortOrder:
                    state.sortBy === action.field && state.sortOrder === 'ASC'
                        ? 'DESC'
                        : 'ASC',
                page: 1,
            };
        case 'pageSize':
            return {
                ...state,
                pageSize:
                    action.value === 50 || action.value === 100
                        ? action.value
                        : 20,
                page: 1,
            };
        case 'page':
            return {
                ...state,
                page: clampV18CustomerPage(action.value, action.totalPages),
            };
        case 'reset':
            return { ...initialV18CustomerQuery };
    }
}

export function toV18CustomerFilters(
    query: V18CustomerQuery,
): CustomerFilterParams {
    return {
        search: query.search.trim() || undefined,
        groupId: query.groupId,
        tagId: query.tagId,
        gender: query.gender,
        ageMin: query.ageMin,
        ageMax: query.ageMax,
        spentMin: query.spentMin,
        spentMax: query.spentMax,
        hasUpcomingVisit: query.quickFilter === 'upcoming' ? true : undefined,
        // Matches the existing CRM's 180-day inactive calculation.
        noVisitSince:
            query.quickFilter === 'inactive6m'
                ? new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
                : undefined,
        recentlyAdded: query.quickFilter === 'new' ? true : undefined,
        noOnlineReservations:
            query.quickFilter === 'offline' ? true : undefined,
        emailConsent:
            query.quickFilter === 'noEmailConsent' ? false : undefined,
        smsConsent: query.quickFilter === 'noSmsConsent' ? false : undefined,
        page: query.page,
        limit: query.pageSize,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
    };
}

export function v18CustomerPageInfo(
    data: PaginatedCustomers | undefined,
    requestedPage: number,
) {
    const total = Math.max(0, Math.trunc(data?.total ?? 0));
    const limit = positiveInt(data?.limit ?? 20, 20);
    // A zero-result response has no actual page; UI still shows page 1 of 1.
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = clampV18CustomerPage(requestedPage, totalPages);
    const start = total === 0 ? 0 : (page - 1) * limit + 1;
    const end = Math.min(total, page * limit);
    return { total, page, totalPages, start, end };
}
