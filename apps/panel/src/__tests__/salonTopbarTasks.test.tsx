import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SalonTopbar from '@/components/salon/SalonTopbar';

const push = jest.fn();
const eventsOn = jest.fn();
const eventsOff = jest.fn();
const pendingCountMock = jest.fn(() => 22);

jest.mock('next/router', () => ({
    useRouter: () => ({
        push,
        events: {
            on: eventsOn,
            off: eventsOff,
        },
    }),
}));

jest.mock('@/hooks/useAppointments', () => ({
    usePendingBookingsCount: () => pendingCountMock(),
}));

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 1, name: 'QA User', role: 'admin' },
        logout: jest.fn().mockResolvedValue(undefined),
    }),
}));

describe('SalonTopbar tasks tooltip', () => {
    beforeEach(() => {
        pendingCountMock.mockReturnValue(22);
    });

    it('shows pending confirmations entry in tasks tooltip', () => {
        render(<SalonTopbar />);

        fireEvent.click(screen.getByTitle('Twoje zadania'));

        expect(
            screen.getByText('Wizyty oczekujące na potwierdzenie'),
        ).toBeInTheDocument();
        expect(screen.getByText('22')).toBeInTheDocument();
    });

    it('shows empty state when there are no pending confirmations', () => {
        pendingCountMock.mockReturnValue(0);
        render(<SalonTopbar />);

        fireEvent.click(screen.getByTitle('Twoje zadania'));

        expect(
            screen.getByText('Brak oczekujących wizyt.'),
        ).toBeInTheDocument();
    });
});
