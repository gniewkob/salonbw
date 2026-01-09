import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ServicesPage from '@/pages/services';
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
        // @ts-expect-error jsdom window doesn't define gtag
        window.gtag = jest.fn();
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

    it('emits view_item on service page and sends begin_checkout/select_item on CTA', () => {
        render(<ColoringPage />);
        let calls = (window.gtag as jest.Mock).mock.calls;
        expect(calls.find((c) => c[1] === 'view_item')).toBeTruthy();

        const cta = screen.getByText(/Book an appointment/i);
        fireEvent.click(cta);

        calls = (window.gtag as jest.Mock).mock.calls;
        expect(calls.find((c) => c[1] === 'select_item')).toBeTruthy();
        expect(calls.find((c) => c[1] === 'begin_checkout')).toBeTruthy();
    });
});
