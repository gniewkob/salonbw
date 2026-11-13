import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import NotFound from '@/pages/404';

jest.mock(
    'next/head',
    () =>
        function MockHead({ children }: { children: ReactNode }) {
            return <>{children}</>;
        },
);
jest.mock('@/components/PublicLayout', () => ({
    __esModule: true,
    default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
jest.mock('@/components/BookingModal', () => ({
    __esModule: true,
    default: ({ open }: { open: boolean }) =>
        open ? <div role="dialog">Rezerwacje online już wkrótce</div> : null,
}));
jest.mock('@/contexts/LanguageContext', () => ({
    useLanguage: () => ({
        T: { nav: { booking: 'Umów wizytę' } },
    }),
}));

describe('404 booking action', () => {
    it('opens the shared booking notice instead of bypassing it', () => {
        render(<NotFound />);

        fireEvent.click(screen.getByRole('button', { name: 'Umów wizytę' }));
        expect(screen.getByRole('dialog')).toHaveTextContent(
            'Rezerwacje online już wkrótce',
        );
        expect(screen.queryByRole('link', { name: 'Umów wizytę' })).toBeNull();
    });
});
