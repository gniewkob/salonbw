import { renderHook } from '@testing-library/react';
import { useCustomerAlerts } from '@/hooks/useCustomerAlerts';

const useCustomerStatisticsMock = jest.fn();
const useCustomerNotesMock = jest.fn();
const useTagsForCustomerMock = jest.fn();
const useCustomerMock = jest.fn();

jest.mock('@/hooks/useCustomers', () => ({
    useCustomerStatistics: (...args: unknown[]) =>
        useCustomerStatisticsMock(...args),
    useCustomerNotes: (...args: unknown[]) => useCustomerNotesMock(...args),
    useTagsForCustomer: (...args: unknown[]) => useTagsForCustomerMock(...args),
    useCustomer: (...args: unknown[]) => useCustomerMock(...args),
}));

describe('useCustomerAlerts', () => {
    beforeEach(() => {
        useCustomerStatisticsMock.mockReset();
        useCustomerNotesMock.mockReset();
        useTagsForCustomerMock.mockReset();
        useCustomerMock.mockReset();

        useCustomerStatisticsMock.mockReturnValue({
            data: { noShowVisits: 0 },
            isLoading: false,
        });
        useCustomerNotesMock.mockReturnValue({
            data: [],
            isLoading: false,
        });
        useTagsForCustomerMock.mockReturnValue({
            data: [],
            isLoading: false,
        });
        useCustomerMock.mockReturnValue({
            data: { groups: [] },
            isLoading: false,
        });
    });

    it('derives alerts from no-show and pinned warning/medical/preference notes', () => {
        useCustomerStatisticsMock.mockReturnValue({
            data: { noShowVisits: 1 },
            isLoading: false,
        });
        useCustomerNotesMock.mockReturnValue({
            data: [
                {
                    id: 11,
                    type: 'medical',
                    content: 'Alergia na lateks',
                    isPinned: true,
                },
                {
                    id: 12,
                    type: 'preference',
                    content: 'Bez amoniaku',
                    isPinned: true,
                },
                {
                    id: 13,
                    type: 'warning',
                    content: 'Wymagana przedpłata',
                    isPinned: false,
                },
            ],
            isLoading: false,
        });

        const { result } = renderHook(() => useCustomerAlerts(123));
        const alerts = result.current.alerts;

        expect(alerts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    source: 'stats',
                    label: 'Historia no-show',
                    severity: 'warning',
                }),
                expect.objectContaining({
                    source: 'note',
                    label: 'Notatka medyczna',
                    detail: 'Alergia na lateks',
                    severity: 'danger',
                }),
                expect.objectContaining({
                    source: 'note',
                    label: 'Preferencja klienta',
                    detail: 'Bez amoniaku',
                    severity: 'warning',
                }),
            ]),
        );
        expect(
            alerts.some((alert) => alert.detail === 'Wymagana przedpłata'),
        ).toBe(false);
    });

    it('returns loading when any alert source is loading', () => {
        useCustomerNotesMock.mockReturnValue({
            data: [],
            isLoading: true,
        });

        const { result } = renderHook(() => useCustomerAlerts(123));
        expect(result.current.isLoading).toBe(true);
    });
});
