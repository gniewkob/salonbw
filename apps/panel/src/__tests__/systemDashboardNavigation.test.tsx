import { render, screen } from '@testing-library/react';
import SalonSecondaryNav from '@/components/salon/SalonSecondaryNav';
import type { SalonModule } from '@/components/salon/navigation';
import { useAuth } from '@/contexts/AuthContext';

jest.mock('@/contexts/AuthContext');
jest.mock('next/router', () => ({
    useRouter: () => ({ pathname: '/dashboard', query: {} }),
}));
jest.mock(
    '@/components/salon/navs/CalendarNav',
    () =>
        function MockCalendar() {
            return <div>PRACOWNICY</div>;
        },
);
it('uses technical navigation instead of employee calendar filters on the technical dashboard', () => {
    (useAuth as jest.Mock).mockReturnValue({
        role: 'admin',
        user: { isSystemAdmin: true },
    });
    render(
        <SalonSecondaryNav
            module={
                {
                    key: 'calendar',
                    secondaryNav: true,
                } as unknown as SalonModule
            }
        />,
    );
    expect(
        screen.getByRole('navigation', { name: 'Administracja systemu' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('PRACOWNICY')).not.toBeInTheDocument();
});
