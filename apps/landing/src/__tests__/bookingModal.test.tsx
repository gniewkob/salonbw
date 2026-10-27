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
