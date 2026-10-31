import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ServicesPage, { getServerSideProps } from '@/pages/services';
import ColoringPage from '@/pages/services/coloring';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Analytics events on services', () => {
    beforeEach(() => {
        // Enable analytics for client code
        process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = 'true';
        process.env.NEXT_PUBLIC_GA_ID = 'G-TEST123';
        window.localStorage.setItem(
            'sbw-consent',
            JSON.stringify({
                analytics: 'granted',
                decidedAt: new Date().toISOString(),
            }),
        );
        // @ts-expect-error jsdom window doesn't define gtag
        window.gtag = jest.fn();
        (global.fetch as jest.Mock).mockReset();
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({}),
            text: async () => '',
        });
        mockedUseAuth.mockReturnValue(createAuthValue());
    });

    afterEach(() => {
        // @ts-expect-error jsdom window doesn't define gtag
        delete window.gtag;
    });

    it('emits view_item_list on services list', () => {
        render(
            <ServicesPage
                categories={[
                    {
                        id: 1,
                        name: 'Color',
                        services: [
                            {
                                id: 10,
                                name: 'Hair Coloring',
                                duration: 60,
                                price: 100,
                            },
                            {
                                id: 11,
                                name: 'Highlights',
                                duration: 45,
                                price: 120,
                            },
                        ],
                    },
                ]}
            />,
        );
        const calls = (window.gtag as jest.Mock).mock.calls;
        expect(calls.find((c) => c[1] === 'view_item_list')).toBeTruthy();
    });

    it('shows an unavailable state instead of static sample services', () => {
        render(<ServicesPage categories={[]} />);

        expect(
            screen.getByRole('heading', {
                name: /Oferta chwilowo niedostępna/i,
            }),
        ).toBeInTheDocument();
        expect(
            screen.queryByText('Strzyżenie damskie'),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByText('Koloryzacja Air Touch'),
        ).not.toBeInTheDocument();
    });

    it('does not promise uniform weekday hours in the booking CTA', () => {
        render(<ServicesPage categories={[]} />);

        expect(
            screen.queryByText(/09:00\s*-\s*19:00 w tygodniu/),
        ).not.toBeInTheDocument();
    });

    it('does not return static service fallback from SSR when API fails', async () => {
        const fetchMock = global.fetch as jest.Mock;
        fetchMock.mockRejectedValueOnce(new Error('unavailable'));

        const result = await getServerSideProps({} as never);

        expect(result).toEqual({ props: { categories: [] } });
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringMatching(/\/services\/public$/),
            expect.objectContaining({
                headers: { Accept: 'application/json' },
            }),
        );
    });

    it('emits view_item on service page and sends begin_checkout/select_item on CTA', () => {
        render(<ColoringPage />);
        let calls = (window.gtag as jest.Mock).mock.calls;
        expect(calls.find((c) => c[1] === 'view_item')).toBeTruthy();

        const cta = screen.getByTestId('coloring-cta');
        fireEvent.click(cta);

        calls = (window.gtag as jest.Mock).mock.calls;
        expect(calls.find((c) => c[1] === 'select_item')).toBeTruthy();
        expect(calls.find((c) => c[1] === 'begin_checkout')).toBeTruthy();
    });
    it('starts at the matching live offer but preserves manual category browsing', () => {
        render(
            <ServicesPage
                focusedOffer="care"
                categories={[
                    {
                        id: 1,
                        name: 'Fryzjerstwo damskie',
                        services: [
                            { id: 20, name: 'Strzyżenie damskie', price: 120, duration: 60 },
                        ],
                    },
                    {
                        id: 2,
                        name: 'Pielęgnacja włosów',
                        services: [
                            { id: 21, name: 'Zabieg Olaplex', price: 180, duration: 45 },
                        ],
                    },
                ]}
            />,
        );

        expect(screen.getByText('Zabieg Olaplex')).toBeInTheDocument();
        expect(screen.queryByText('Strzyżenie damskie')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Fryzjerstwo damskie' }));
        expect(screen.getByText('Strzyżenie damskie')).toBeInTheDocument();
        expect(screen.queryByText('Zabieg Olaplex')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Wszystkie' }));
        expect(screen.getByText('Strzyżenie damskie')).toBeInTheDocument();
        expect(screen.getByText('Zabieg Olaplex')).toBeInTheDocument();
    });

    it('does not hide colouring when a deep-link advertises haircutting and colouring', () => {
        render(
            <ServicesPage
                focusedOffer="hairdressing"
                categories={[
                    {
                        id: 1,
                        name: 'Fryzjerstwo',
                        services: [
                            { id: 31, name: 'Strzyżenie damskie', price: 110, duration: 45 },
                        ],
                    },
                    {
                        id: 2,
                        name: 'Koloryzacja',
                        services: [
                            { id: 32, name: 'Koloryzacja Air Touch', price: 400, duration: 180 },
                        ],
                    },
                    {
                        id: 3,
                        name: 'Pielęgnacja',
                        services: [
                            { id: 33, name: 'Olaplex', price: 100, duration: 45 },
                        ],
                    },
                ]}
            />,
        );
        expect(screen.getByText('Strzyżenie damskie')).toBeInTheDocument();
        expect(screen.getByText('Koloryzacja Air Touch')).toBeInTheDocument();
        expect(screen.queryByText('Olaplex')).not.toBeInTheDocument();

        const all = screen.getByRole('button', { name: 'Wszystkie' });
        expect(all).toHaveAttribute('aria-pressed', 'false');
        fireEvent.click(all);
        expect(all).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByText('Olaplex')).toBeInTheDocument();
    });

    it('shows the live active variant price floor without withdrawn prices', () => {
        const { container } = render(
            <ServicesPage
                categories={[
                    {
                        id: 1,
                        name: 'Koloryzacja',
                        services: [
                            {
                                id: 100,
                                name: 'Koloryzacja',
                                price: 280,
                                duration: 90,
                                variants: [
                                    { id: 101, name: 'krótkie', price: 280, duration: 90, isActive: true },
                                    { id: 102, name: 'długie', price: 390, duration: 150, isActive: true },
                                    { id: 103, name: 'wycofane', price: 50, duration: 30, isActive: false },
                                ],
                            },
                        ],
                    },
                ]}
            />,
        );

        const price = container.querySelector('.svcs-row__meta .svcs-row__price');
        expect(price).toHaveTextContent(/od\\s+280,00\\s*zł/);

        fireEvent.click(screen.getByText('Sprawdź warianty i ceny'));
        expect(screen.getByText('Koloryzacja — krótkie')).toBeInTheDocument();
        expect(screen.getByText('Koloryzacja — długie')).toBeInTheDocument();
        expect(screen.queryByText('Koloryzacja — wycofane')).not.toBeInTheDocument();
    });

    it('passes a validated marketing offer through SSR without inventing catalog data', async () => {
        const service = {
            id: 21,
            name: 'Zabieg Olaplex',
            category: 'Pielęgnacja włosów',
            onlineBooking: true,
            duration: 45,
            price: 180,
        };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [service],
        });

        expect(await getServerSideProps({ query: { offer: 'care' } } as never)).toEqual({
            props: {
                focusedOffer: 'care',
                categories: [
                    { id: null, name: 'Pielęgnacja włosów', services: [service] },
                ],
            },
        });
    });

});
