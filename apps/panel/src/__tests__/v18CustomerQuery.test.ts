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
