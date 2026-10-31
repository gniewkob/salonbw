import { render, screen } from '@testing-library/react';
import MobileNavDrawer from '@/components/salon/MobileNavDrawer';

jest.mock('@/hooks/useReducedMotion', () => ({
    useReducedMotion: () => false,
}));

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ user: null }),
}));

jest.mock('@/components/salon/SalonGlobalSearch', () => ({
    __esModule: true,
    default: () => null,
}));

describe('MobileNavDrawer closed-state visibility', () => {
    it('removes a closed drawer from layout and reveals it when opened', () => {
        const props = {
            modules: [],
            activeKey: 'calendar',
            onClose: jest.fn(),
        };

        const { rerender } = render(
            <MobileNavDrawer {...props} open={false} />,
        );

        const drawer = screen.getByRole('navigation', { hidden: true });
        expect(drawer).toHaveAttribute('hidden');
        expect(drawer).toHaveStyle({ display: 'none' });
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

        rerender(<MobileNavDrawer {...props} open={true} />);

        const opened = screen.getByRole('navigation');
        expect(opened).not.toHaveAttribute('hidden');
        expect(opened).toHaveStyle({ display: 'flex' });

        rerender(<MobileNavDrawer {...props} open={false} />);
        expect(drawer).toHaveAttribute('hidden');
        expect(drawer).toHaveStyle({ display: 'none' });
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });
});
