import { render, screen } from '@testing-library/react';
import StatisticsNav from '@/components/salon/navs/StatisticsNav';

jest.mock('next/router', () => ({
    useRouter: () => ({
        pathname: '/statistics',
    }),
}));

describe('StatisticsNav', () => {
    it('shows link to CRM follow-up audit view', () => {
        render(<StatisticsNav />);

        const link = screen.getByRole('link', { name: 'Audyt follow-up CRM' });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/statistics/follow-up');
    });
});
