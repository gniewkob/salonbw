import { fireEvent, render, screen } from '@testing-library/react';
import type { GetServerSidePropsContext } from 'next';
import DesignLabPage, { getServerSideProps } from '@/pages/design-lab';

jest.mock('@/styles/DesignLab.module.css', () => ({
    lab: 'lab',
    controls: 'controls',
    controlsInner: 'controlsInner',
    labMark: 'labMark',
    labTitle: 'labTitle',
    labDescription: 'labDescription',
    variantPicker: 'variantPicker',
    variantButton: 'variantButton',
    variantActive: 'variantActive',
    previewLabel: 'previewLabel',
}));

jest.mock('next/head', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({
        children,
        href,
    }: {
        children: React.ReactNode;
        href: string;
    }) => <a href={href}>{children}</a>,
}));

jest.mock('@/components/PublicLayout', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/SplitHero', () => ({
    __esModule: true,
    default: () => <div data-testid="baseline-hero" />,
}));
jest.mock('@/components/ServicesTeaser', () => ({
    __esModule: true,
    default: () => <div data-testid="services-teaser" />,
}));
jest.mock('@/components/SalonGallery', () => ({
    __esModule: true,
    default: () => <div data-testid="gallery" />,
}));
jest.mock('@/components/Testimonials', () => ({
    __esModule: true,
    default: () => <div data-testid="testimonials" />,
}));
jest.mock('@/components/BookingCta', () => ({
    __esModule: true,
    default: () => <div data-testid="booking-cta" />,
}));
jest.mock('@/components/NearestSlotTeaser', () => ({
    __esModule: true,
    default: () => <div data-testid="nearest-slot" />,
}));
jest.mock('@/components/BookingModal', () => ({
    __esModule: true,
    default: ({ open }: { open: boolean }) =>
        open ? <div role="dialog" aria-label="Rezerwacja" /> : null,
}));

jest.mock('@/contexts/LanguageContext', () => ({
    useLanguage: () => ({
        lang: 'pl',
        T: {
            nav: {
                home: 'Start',
                booking: 'Umów wizytę',
            },
            hero: { imageAlt: 'Wnętrze salonu' },
        },
    }),
}));

describe('SalonBW development-only design lab', () => {
    const previousEnv = process.env.APP_ENV;

    afterEach(() => {
        if (previousEnv === undefined) {
            delete process.env.APP_ENV;
        } else {
            process.env.APP_ENV = previousEnv;
        }
    });

    it('returns 404 for production and missing APP_ENV', async () => {
        delete process.env.APP_ENV;
        await expect(
            getServerSideProps({} as GetServerSidePropsContext),
        ).resolves.toEqual({ notFound: true });

        process.env.APP_ENV = 'production';
        await expect(
            getServerSideProps({} as GetServerSidePropsContext),
        ).resolves.toEqual({ notFound: true });
    });

    it('allows the internal route on development even with NODE_ENV production', async () => {
        process.env.APP_ENV = 'development';
        await expect(
            getServerSideProps({} as GetServerSidePropsContext),
        ).resolves.toEqual({ props: {} });
    });

    it('shows editorial by default and makes the booking flow available', () => {
        render(<DesignLabPage />);

        expect(
            screen.getByRole('heading', { name: 'Włosy w dobrych rękach.' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Editorial Premium' }),
        ).toHaveAttribute('aria-pressed', 'true');

        fireEvent.click(screen.getByRole('button', { name: 'Umów wizytę' }));
        expect(screen.getByRole('dialog', { name: 'Rezerwacja' })).toBeInTheDocument();
    });

    it('switches to booking-first with service links and actual availability teaser', () => {
        render(<DesignLabPage />);
        fireEvent.click(screen.getByRole('button', { name: 'Booking First' }));

        expect(
            screen.getByRole('heading', { name: 'Znajdź chwilę dla swoich włosów.' }),
        ).toBeInTheDocument();
        expect(screen.getByTestId('nearest-slot')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Booking First' })).toHaveAttribute(
            'aria-pressed',
            'true',
        );
        expect(screen.getByText('Koloryzacja').closest('a')).toHaveAttribute(
            'href',
            '/services',
        );
    });

    it('preserves existing baseline components when selected', () => {
        render(<DesignLabPage />);
        fireEvent.click(screen.getByRole('button', { name: 'Obecny projekt' }));

        expect(screen.getByTestId('baseline-hero')).toBeInTheDocument();
        expect(screen.getByTestId('services-teaser')).toBeInTheDocument();
        expect(screen.getByTestId('booking-cta')).toBeInTheDocument();
    });

    it('marks the entire preview noindex', () => {
        const { container } = render(<DesignLabPage />);
        expect(container.querySelector('meta[name="robots"]')).toHaveAttribute(
            'content',
            'noindex, nofollow, noarchive',
        );
    });
});
