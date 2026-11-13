import { render, screen } from '@testing-library/react';
import BookingModal from '@/components/BookingModal';
import { LanguageProvider } from '@/contexts/LanguageContext';

jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ login: jest.fn(), isAuthenticated: false }),
}));
jest.mock('@/utils/panelUrl', () => ({
    getPanelUrl: (path: string) => `https://panel.example.invalid${path}`,
}));

it.each([undefined, { id: 42, name: 'UAT', priceLabel: '10 zł', duration: '15 min' }])(
    'passes the booking destination to registration', (service) => {
        render(<LanguageProvider><BookingModal open onClose={jest.fn()} service={service} /></LanguageProvider>);
        const link = screen.getByRole('link', { name: 'Zarejestruj się' });
        const url = new URL(link.getAttribute('href')!);
        expect(url.pathname).toBe('/auth/register');
        expect(url.searchParams.get('redirectTo')).toBe(service ? '/booking?serviceId=42' : '/booking');
    },
);

it('blocks production booking entry and offers the salon phone instead', () => {
    const original = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV;
    process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = 'production';

    try {
        render(
            <LanguageProvider>
                <BookingModal open onClose={jest.fn()} />
            </LanguageProvider>,
        );

        expect(screen.getByRole('dialog')).toHaveAccessibleName(
            'Rezerwacje online już wkrótce',
        );
        expect(
            screen.getByRole('link', { name: /zadzwoń/i }),
        ).toHaveAttribute('href', 'tel:+48723588868');
        expect(screen.queryByRole('link', { name: 'Zarejestruj się' })).toBeNull();
        expect(screen.queryByRole('textbox')).toBeNull();
    } finally {
        if (original === undefined) delete process.env.NEXT_PUBLIC_DEPLOYMENT_ENV;
        else process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = original;
    }
});
