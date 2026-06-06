import { render, screen } from '@testing-library/react';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';

describe('SalonBreadcrumbs', () => {
    it('renders the vendor-style breadcrumbs wrapper with icon and links', () => {
        const { container } = render(
            <SalonBreadcrumbs
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

    it('wraps in nav landmark with aria-label', () => {
        render(
            <SalonBreadcrumbs
                iconClass="sprite-breadcrumbs_statistics"
                items={[
                    { label: 'Statystyki', href: '/statistics' },
                    { label: 'Raport finansowy' },
                ]}
            />,
        );

        const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
        expect(nav).toBeInTheDocument();
    });

    it('marks last item with aria-current="page"', () => {
        render(
            <SalonBreadcrumbs
                iconClass="sprite-breadcrumbs_statistics"
                items={[
                    { label: 'Statystyki', href: '/statistics' },
                    { label: 'Raport finansowy' },
                ]}
            />,
        );

        const lastItem = screen.getByText('Raport finansowy');
        expect(lastItem).toHaveAttribute('aria-current', 'page');
    });

    it('renders nothing when items is empty', () => {
        const { container } = render(
            <SalonBreadcrumbs iconClass="sprite-breadcrumbs_statistics" items={[]} />,
        );
        expect(container.firstChild).toBeNull();
    });
});
