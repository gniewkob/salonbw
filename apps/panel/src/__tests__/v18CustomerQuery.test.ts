import {
    clampV18CustomerPage,
    initialV18CustomerQuery,
    reduceV18CustomerQuery,
    toV18CustomerFilters,
    v18CustomerPageInfo,
} from '@/utils/v18CustomerQuery';

describe('V18 Customers server-query contract', () => {
    const pageThree = { ...initialV18CustomerQuery, page: 3 };

    it('resets pagination when search or group changes', () => {
        const searched = reduceV18CustomerQuery(pageThree, {
            type: 'search',
            value: '  Anna  ',
        });
        expect(searched.page).toBe(1);
        expect(toV18CustomerFilters(searched).search).toBe('Anna');

        const grouped = reduceV18CustomerQuery(pageThree, {
            type: 'group',
            groupId: 12,
        });
        expect(grouped).toMatchObject({ groupId: 12, page: 1 });
    });

    it('only exposes sortable fields supported by the customer API', () => {
        const first = reduceV18CustomerQuery(pageThree, {
            type: 'sort',
            field: 'email',
        });
        const second = reduceV18CustomerQuery(first, {
            type: 'sort',
            field: 'email',
        });
        expect(first).toMatchObject({
            sortBy: 'email',
            sortOrder: 'ASC',
            page: 1,
        });
        expect(second.sortOrder).toBe('DESC');
        expect(toV18CustomerFilters(second).sortBy).toBe('email');
    });

    it('clamps pagination and validates the page size', () => {
        expect(clampV18CustomerPage(-1, 10)).toBe(1);
        expect(clampV18CustomerPage(999, 4)).toBe(4);
        expect(clampV18CustomerPage(Number.NaN, 0)).toBe(1);
        expect(
            reduceV18CustomerQuery(pageThree, {
                type: 'page',
                value: 999,
                totalPages: 4,
            }).page,
        ).toBe(4);
        expect(
            reduceV18CustomerQuery(pageThree, {
                type: 'pageSize',
                value: 42,
            }),
        ).toMatchObject({ pageSize: 20, page: 1 });
    });

    it('validates tag IDs and clears pagination for tag changes', () => {
        const tagged = reduceV18CustomerQuery(pageThree, {
            type: 'tag',
            tagId: 9,
        });
        expect(tagged).toMatchObject({ tagId: 9, page: 1 });
        expect(toV18CustomerFilters(tagged).tagId).toBe(9);

        const invalid = reduceV18CustomerQuery(tagged, {
            type: 'tag',
            tagId: Number.NaN,
        });
        expect(invalid.tagId).toBeUndefined();
        expect(invalid.page).toBe(1);
    });

    it('maps all five legacy quick filters to the existing server contract', () => {
        const upcoming = reduceV18CustomerQuery(pageThree, {
            type: 'quickFilter',
            value: 'upcoming',
        });
        expect(upcoming.page).toBe(1);
        expect(toV18CustomerFilters(upcoming).hasUpcomingVisit).toBe(true);

        const noEmail = reduceV18CustomerQuery(pageThree, {
            type: 'quickFilter',
            value: 'noEmailConsent',
        });
        expect(toV18CustomerFilters(noEmail).emailConsent).toBe(false);
        expect(toV18CustomerFilters(noEmail).smsConsent).toBeUndefined();

        const noSms = reduceV18CustomerQuery(pageThree, {
            type: 'quickFilter',
            value: 'noSmsConsent',
        });
        expect(toV18CustomerFilters(noSms).smsConsent).toBe(false);

        const recent = reduceV18CustomerQuery(pageThree, {
            type: 'quickFilter',
            value: 'new',
        });
        expect(toV18CustomerFilters(recent).recentlyAdded).toBe(true);

        const now = Date.UTC(2026, 10, 5, 12, 0, 0);
        const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
        try {
            const inactive = reduceV18CustomerQuery(pageThree, {
                type: 'quickFilter',
                value: 'inactive6m',
            });
            expect(toV18CustomerFilters(inactive).noVisitSince).toBe(
                new Date(now - 180 * 24 * 60 * 60 * 1000).toISOString(),
            );
        } finally {
            clock.mockRestore();
        }
    });

    it('toggles the active quick filter off and resets all filters', () => {
        const tagged = reduceV18CustomerQuery(pageThree, {
            type: 'tag',
            tagId: 9,
        });
        const active = reduceV18CustomerQuery(tagged, {
            type: 'quickFilter',
            value: 'upcoming',
        });
        const inactive = reduceV18CustomerQuery(active, {
            type: 'quickFilter',
            value: 'upcoming',
        });
        expect(inactive.quickFilter).toBe('');
        expect(inactive.tagId).toBe(9);
        expect(reduceV18CustomerQuery(active, { type: 'reset' })).toEqual(
            initialV18CustomerQuery,
        );
    });

    it('maps advanced gender, age and spend filters to the existing API', () => {
        const gender = reduceV18CustomerQuery(pageThree, {
            type: 'advancedGender',
            value: 'female',
        });
        const ageMin = reduceV18CustomerQuery(gender, {
            type: 'advancedNumber',
            field: 'ageMin',
            value: 25,
        });
        const ageMax = reduceV18CustomerQuery(ageMin, {
            type: 'advancedNumber',
            field: 'ageMax',
            value: 60,
        });
        const spentMin = reduceV18CustomerQuery(ageMax, {
            type: 'advancedNumber',
            field: 'spentMin',
            value: 0,
        });
        const spentMax = reduceV18CustomerQuery(spentMin, {
            type: 'advancedNumber',
            field: 'spentMax',
            value: 250.5,
        });

        expect(spentMax.page).toBe(1);
        expect(toV18CustomerFilters(spentMax)).toMatchObject({
            gender: 'female',
            ageMin: 25,
            ageMax: 60,
            spentMin: 0,
            spentMax: 250.5,
            page: 1,
        });
        expect(reduceV18CustomerQuery(spentMax, { type: 'reset' })).toEqual(
            initialV18CustomerQuery,
        );
    });

    it('rejects invalid age and spend values rather than sending bad API parameters', () => {
        const invalidAge = reduceV18CustomerQuery(pageThree, {
            type: 'advancedNumber',
            field: 'ageMin',
            value: 151,
        });
        const invalidSpend = reduceV18CustomerQuery(pageThree, {
            type: 'advancedNumber',
            field: 'spentMax',
            value: -1,
        });
        expect(invalidAge.ageMin).toBeUndefined();
        expect(invalidSpend.spentMax).toBeUndefined();
        expect(invalidAge.page).toBe(1);
        expect(toV18CustomerFilters(invalidAge).ageMin).toBeUndefined();
    });

    it('maps the offline-customer quick filter to the backend boolean', () => {
        const offline = reduceV18CustomerQuery(pageThree, {
            type: 'quickFilter',
            value: 'offline',
        });
        expect(toV18CustomerFilters(offline).noOnlineReservations).toBe(true);
        expect(toV18CustomerFilters(offline).hasUpcomingVisit).toBeUndefined();
        const cleared = reduceV18CustomerQuery(offline, {
            type: 'quickFilter',
            value: 'offline',
        });
        expect(toV18CustomerFilters(cleared).noOnlineReservations).toBeUndefined();
    });

    it('uses the server total, not the current page length', () => {
        const response = {
            items: [],
            total: 45,
            page: 3,
            limit: 20,
            totalPages: 3,
        };
        expect(v18CustomerPageInfo(response, 3)).toEqual({
            total: 45,
            page: 3,
            totalPages: 3,
            start: 41,
            end: 45,
        });
        expect(v18CustomerPageInfo(undefined, 9)).toEqual({
            total: 0,
            page: 1,
            totalPages: 1,
            start: 0,
            end: 0,
        });
    });
});
