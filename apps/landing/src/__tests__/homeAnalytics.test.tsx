import { render, screen } from '@testing-library/react';
import React from 'react';
import HomePage from '@/pages/index';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');
jest.mock(
    'next/head',
    () =>
        function MockHead({ children }: { children: React.ReactNode }) {
            return <>{children}</>;
        },
);
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const homeProps = {
    founder: {
        name: 'CMS Founder',
        quote: 'CMS founder quote',
        photo: '/images/founder/aleksandra-bodora.jpg',
    },
    galleryImages: [],
};

describe('Home analytics', () => {
    beforeEach(() => {
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
        mockedUseAuth.mockReturnValue(createAuthValue());
    });

    afterEach(() => {
        // @ts-expect-error jsdom window doesn't define gtag
        delete window.gtag;
    });

    it('emits page_view for home page', () => {
        render(<HomePage {...homeProps} />);
        const calls = (window.gtag as jest.Mock).mock.calls;
        expect(
            calls.find(
                (c) => c[1] === 'page_view' && c[2]?.page_title === 'Home',
            ),
        ).toBeTruthy();
    });

    it('renders the Polish founder message received from CMS', () => {
        render(<HomePage {...homeProps} />);

        expect(screen.getByText('CMS Founder')).toBeInTheDocument();
        expect(screen.getByText('CMS founder quote')).toBeInTheDocument();
    });

    it('renders SEO hours from the same server schedule as the contact section', () => {
        const props = {
            ...homeProps,
            openingHours: {
                mon: [{ open: '11:00', close: '15:00' }],
                tue: [],
                wed: [],
                thu: [],
                fri: [],
                sat: [],
                sun: [],
            },
        };
        const { container } = render(<HomePage {...props} />);
        const schema = JSON.parse(
            container.querySelector('script[type="application/ld+json"]')!
                .textContent!,
        );
        expect(schema.openingHoursSpecification).toEqual([
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: 'Monday',
                opens: '11:00',
                closes: '15:00',
            },
        ]);
        expect(screen.getByText('11:00 - 15:00')).toBeInTheDocument();
    });

    it('does not advertise Sunday as closed when the owner opens it in the schedule', () => {
        const props = {
            ...homeProps,
            openingHours: {
                mon: [],
                tue: [],
                wed: [],
                thu: [],
                fri: [],
                sat: [],
                sun: [{ open: '10:00', close: '14:00' }],
            },
        };
        render(<HomePage {...props} />);
        expect(screen.getByText('10:00 - 14:00')).toBeInTheDocument();
        const sunday = screen.queryByText('Niedziela')?.parentElement;
        expect(sunday?.textContent ?? '').not.toContain('Zamknięte');
    });
});
