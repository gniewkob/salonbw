import { render, screen } from '@testing-library/react';
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
jest.mock('@/contexts/LanguageContext', () => ({
    useLanguage: () => ({
        T: { nav: { booking: 'Umów wizytę' } },
    }),
}));

describe('404 booking action', () => {
    it('links directly to the own client booking wizard instead of the old appointments route', () => {
        render(<NotFound />);

        expect(
            screen.getByRole('link', { name: 'Umów wizytę' }),
        ).toHaveAttribute(
            'href',
            expect.stringMatching(/\/booking(?:\?.*)?$/),
        );
    });
});
