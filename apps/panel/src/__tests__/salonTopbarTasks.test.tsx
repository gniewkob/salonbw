import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SalonTopbar from '@/components/salon/SalonTopbar';

const push = jest.fn();
const eventsOn = jest.fn();
const eventsOff = jest.fn();
const pendingCountMock = jest.fn(() => 22);
let topbarUser = { id: 1, name: 'QA User', role: 'admin' };

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
        user: topbarUser,
        logout: jest.fn().mockResolvedValue(undefined),
    }),
}));

describe('SalonTopbar tasks tooltip', () => {
    beforeEach(() => {
        pendingCountMock.mockReturnValue(22);
        topbarUser = { id: 1, name: 'QA User', role: 'admin' };
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

    it('uses profile photo in the topbar button when avatar is available', () => {
        topbarUser = {
            id: 1,
            name: 'QA User',
            role: 'admin',
            avatarUrl: 'https://example.com/avatar.jpg',
        };

        const { container } = render(<SalonTopbar />);

        const button = container.querySelector('.e2e-nav-user-dropdown');
        const avatar = button?.querySelector('img.color1--img');

        expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
        expect(button).not.toHaveTextContent('QU');
    });
});
