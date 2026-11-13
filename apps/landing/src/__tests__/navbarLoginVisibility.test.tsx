import { fireEvent, render, screen } from '@testing-library/react';
import Navbar from '@/components/Navbar';

jest.mock('next/router', () => ({ useRouter: () => ({ pathname: '/' }) }));
jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ role: null, initialized: true, logout: jest.fn() }),
}));
jest.mock('@/contexts/LanguageContext', () => ({
    useLanguage: () => ({
        lang: 'pl', setLang: jest.fn(),
        T: { nav: { home: 'Start', about: 'O nas', services: 'Usługi', gallery: 'Galeria', contact: 'Kontakt', login: 'Zaloguj', booking: 'Umów wizytę' } },
    }),
}));
jest.mock('@/hooks/useOpeningHours', () => ({ useOpeningHours: () => ({ lines: [] }) }));
jest.mock('@/components/BookingModal', () => ({ __esModule: true, default: () => null }));

describe('public login navigation', () => {
    const original = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV;
    afterEach(() => {
        if (original === undefined) delete process.env.NEXT_PUBLIC_DEPLOYMENT_ENV;
        else process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = original;
    });

    it('hides login in desktop and mobile navigation on production', () => {
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = 'production';
        render(<Navbar />);
        expect(screen.queryByText('Zaloguj')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /menu/i }));
        expect(screen.queryByText('Zaloguj')).not.toBeInTheDocument();
        expect(document.querySelector('a[href*="/auth/login"]')).toBeNull();
    });

    it('retains login in desktop and mobile navigation in development', () => {
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = 'development';
        render(<Navbar />);
        expect(screen.getAllByText('Zaloguj')).toHaveLength(1);
        fireEvent.click(screen.getByRole('button', { name: /menu/i }));
        expect(screen.getAllByText('Zaloguj')).toHaveLength(2);
    });
});
