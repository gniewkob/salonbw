import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import VisitsPage from '@/pages/visits';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('next/router', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), query: {} }),
}));

jest.mock('@/contexts/AuthContext');

jest.mock('@/components/RouteGuard', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/salon/SalonShell', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const FUTURE = new Date(Date.now() + 86400000).toISOString();
const PAST = new Date(Date.now() - 86400000).toISOString();

const VISITS = [
    {
        id: 1,
        startTime: FUTURE,
        endTime: FUTURE,
        status: 'confirmed',
        serviceId: 2,
        serviceName: 'Strzyżenie damskie',
        employeeName: 'Aleksandra',
        notes: null,
        clientComment: 'chca to i koniec - mąż płaci',
        onlineAddonsSummary:
            'Botox na włosy (+180 min), Botox na włosy - włosy do pasa (+180 min)',
        onlineTotalDurationMinutes: 405,
        onlineDurationNeedsVerification: true,
        review: null,
    },
    {
        id: 2,
        startTime: PAST,
        endTime: PAST,
        status: 'completed',
        serviceId: 2,
        serviceName: 'Koloryzacja',
        employeeName: 'Aleksandra',
        notes: null,
        staffRecommendations: 'myć włosy co 3 dni',
        review: null,
    },
    {
        id: 3,
        startTime: PAST,
        endTime: PAST,
        status: 'completed',
        serviceId: 5,
        serviceName: 'Balayage',
        employeeName: 'Aleksandra',
        notes: null,
        review: { id: 9, rating: 5, comment: 'Super!' },
    },
    {
        id: 4,
        startTime: PAST,
        endTime: PAST,
        status: 'cancelled',
        serviceId: 2,
        serviceName: 'Modelowanie',
        employeeName: 'Aleksandra',
        notes: null,
        review: null,
    },
];

function setup(apiFetch: jest.Mock) {
    mockedUseAuth.mockReturnValue(
        createAuthValue({
            role: 'client',
            isAuthenticated: true,
            apiFetch: apiFetch as never,
        }),
    );
    return render(<VisitsPage />);
}

describe('VisitsPage', () => {
    it('renders sections with visits, notes and existing review', async () => {
        const apiFetch = jest.fn(async (path: string) => {
            if (path === '/dashboard/client/visits') return VISITS;
            throw new Error(`unexpected ${path}`);
        });
        setup(apiFetch);

        expect(
            await screen.findByText('Strzyżenie damskie'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: /Nadchodzące wizyty \(1\)/ }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: /Odbyte wizyty \(2\)/ }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', {
                name: /Anulowane i nieodbyte \(1\)/,
            }),
        ).toBeInTheDocument();
        // salon recommendations visible
        expect(screen.getByText(/myć włosy co 3 dni/)).toBeInTheDocument();
        // booking comment and add-on metadata are separated, not merged as recommendations
        expect(screen.getByText('Komentarz do rezerwacji')).toBeInTheDocument();
        expect(
            screen.getByText(/chca to i koniec - mąż płaci/),
        ).toBeInTheDocument();
        expect(screen.getByText('Dodatkowe zabiegi')).toBeInTheDocument();
        expect(screen.getByText('Łączny czas')).toBeInTheDocument();
        expect(screen.queryByText('Status')).not.toBeInTheDocument();
        // existing review renders read-only stars + change button
        expect(screen.getByText(/Super!/)).toBeInTheDocument();
        expect(screen.getByText('Zmień ocenę')).toBeInTheDocument();
        // upcoming visit is cancellable, not reviewable
        expect(screen.getAllByText('Anuluj')).toHaveLength(1);
    });

    it('submits a review for a completed visit with appointmentId + rating', async () => {
        const apiFetch = jest.fn(async (path: string) => {
            if (path === '/dashboard/client/visits') return VISITS;
            if (path === '/reviews') return { id: 10 };
            throw new Error(`unexpected ${path}`);
        });
        setup(apiFetch);

        await screen.findByText('Koloryzacja');
        // one un-reviewed completed visit → exactly one rating form
        const stars = screen.getAllByRole('radio', { name: '4 gwiazdki' });
        expect(stars).toHaveLength(1);
        fireEvent.click(stars[0]);
        fireEvent.change(screen.getByLabelText('Komentarz do wizyty'), {
            target: { value: 'Bardzo miło' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Zapisz ocenę' }));

        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith(
                '/reviews',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        appointmentId: 2,
                        rating: 4,
                        comment: 'Bardzo miło',
                    }),
                }),
            );
        });
    });
});
