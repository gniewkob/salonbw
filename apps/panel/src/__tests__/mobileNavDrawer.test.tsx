import { fireEvent, render, screen } from '@testing-library/react';
import MobileNavDrawer from '@/components/salon/MobileNavDrawer';

const mockLogout = jest.fn(async () => {});
const mockOnClose = jest.fn();
let mockRole: 'client' | 'admin' = 'client';

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 99, role: mockRole },
        logout: mockLogout,
    }),
}));

jest.mock('@/hooks/useReducedMotion', () => ({
    useReducedMotion: () => true,
}));

describe('MobileNavDrawer — logout accessibility', () => {
    beforeEach(() => {
        mockRole = 'client';
        mockLogout.mockClear();
        mockOnClose.mockClear();
    });

    it.each(['client', 'admin'] as const)(
        'provides explicit logout for %s on mobile',
        (role) => {
            mockRole = role;
            render(
                <MobileNavDrawer
                    open
                    modules={[]}
                    activeKey="clientHome"
                    onClose={mockOnClose}
                />,
            );

            const logoutButton = screen.getByRole('button', {
                name: 'Wyloguj się',
            });

            expect(logoutButton).toBeVisible();
            expect(logoutButton).toHaveAttribute('type', 'button');

            fireEvent.click(logoutButton);

            expect(mockOnClose).toHaveBeenCalledTimes(1);
            expect(mockLogout).toHaveBeenCalledTimes(1);
        },
    );

    it('does not terminate the session when opening the drawer', () => {
        render(
            <MobileNavDrawer
                open
                modules={[]}
                activeKey="clientHome"
                onClose={mockOnClose}
            />,
        );

        expect(mockLogout).not.toHaveBeenCalled();
    });
});
