import {
    normalizeCalendarViewPayload,
    renderCalendarViewForm,
    renderCalendarViewsDropdown,
    renderCalendarViewsIndex,
    validateCalendarViewPayload,
} from '@/pages/api/runtime/calendar-views/_shared';

describe('calendar views runtime bridge', () => {
    const employees = [
        { id: 11, name: 'Anna Kowalska' },
        { id: 12, name: 'Beata Nowak' },
    ];

    it('renders dropdown entries with runtime entity payloads', () => {
        const html = renderCalendarViewsDropdown([
            { id: 7, name: 'Koloryzacja', employeeIds: [11, 12] },
        ]);

        expect(html).toContain('data-calendar-view-entities');
        expect(html).toContain('Koloryzacja');
        expect(html).toContain('dodaj/edytuj/usuń');
        expect(html).toContain('/salonblackandwhite/calendar/views');
    });

    it('renders manage list with edit and delete actions', () => {
        const html = renderCalendarViewsIndex(
            [{ id: 7, name: 'Poranek', employeeIds: [11] }],
            employees,
        );

        expect(html).toContain('data-calendar-view-form-link');
        expect(html).toContain('data-destroy-calendar-view');
        expect(html).toContain('/salonblackandwhite/calendar/views/7/edit');
        expect(html).toContain('/api/runtime/calendar-views/7');
        expect(html).toContain('Anna Kowalska');
    });

    it('renders empty manage state when there are no saved views', () => {
        const html = renderCalendarViewsIndex([], employees);

        expect(html).toContain('Brak zdefiniowanych widoków');
        expect(html).toContain('data-views-index-container');
    });

    it('renders form with preselected employee checkboxes', () => {
        const html = renderCalendarViewForm({
            employees,
            value: { id: 7, name: 'Wieczor', employeeIds: [12] },
            action: '/api/runtime/calendar-views/7',
            method: 'PUT',
        });

        expect(html).toContain('name="employeeIds[]"');
        expect(html).toContain('value="12" checked');
        expect(html).toContain('Wieczor');
        expect(html).toContain('action="/api/runtime/calendar-views/7"');
    });

    it('normalizes urlencoded-like request payloads', () => {
        const payload = normalizeCalendarViewPayload({
            name: '  Zespół  ',
            'employeeIds[]': ['11', '12'],
        });

        expect(payload).toEqual({
            name: 'Zespół',
            employeeIds: [11, 12],
        });
    });

    it('validates required name and employee selection', () => {
        expect(
            validateCalendarViewPayload({
                name: '',
                employeeIds: [11],
            }),
        ).toBe('Pole Nazwa jest wymagane.');

        expect(
            validateCalendarViewPayload({
                name: 'Widok',
                employeeIds: [],
            }),
        ).toBe('Wybierz co najmniej jednego pracownika.');

        expect(
            validateCalendarViewPayload({
                name: 'Widok',
                employeeIds: [11],
            }),
        ).toBeNull();
    });
});
