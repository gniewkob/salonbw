import { render, screen } from '@testing-library/react';
import VersumBreadcrumbs from '@/components/salonbw/VersumBreadcrumbs';

describe('VersumBreadcrumbs', () => {
    it('renders the vendor-style breadcrumbs wrapper with icon and links', () => {
        const { container } = render(
            <VersumBreadcrumbs
                iconClass="sprite-breadcrumbs_statistics"
                items={[
                    { label: 'Statystyki', href: '/statistics' },
                    { label: 'Raport finansowy' },
                ]}
            />,
        );

        expect(container.querySelector('.breadcrumbs')).not.toBeNull();
        expect(
            container.querySelector('.icon.sprite-breadcrumbs_statistics'),
        ).not.toBeNull();
        expect(
            screen.getByRole('link', { name: 'Statystyki' }),
        ).toHaveAttribute('href', '/statistics');
        expect(screen.getByText('Raport finansowy')).toBeInTheDocument();
    });
});
