import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { GetServerSidePropsContext } from 'next';
import DesignLab, { getServerSideProps } from '@/pages/design-lab';

jest.mock('@/components/PublicLayout', () => function MockLayout({
    children,
}: { children: ReactNode }) {
    return <main>{children}</main>;
});

jest.mock('@/components/BookingModal', () => function MockBookingModal({
    open,
    onClose,
}: { open: boolean; onClose: () => void }) {
    return open ? (
        <div role="dialog" aria-modal="true">
            <button type="button" onClick={onClose}>Close</button>
        </div>
    ) : null;
});

const ENV_KEYS = [
    'APP_ENV', 'CI', 'WDI_DESIGN_LAB_CI',
    'API_BASE_URL', 'NEXT_PUBLIC_DEPLOYMENT_ENV',
] as const;
const ORIGINAL = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

function context(variant?: string) {
    return { query: variant ? { variant } : {} } as GetServerSidePropsContext;
}

afterEach(() => {
    for (const key of ENV_KEYS) {
        const original = ORIGINAL[key];
        if (original === undefined) delete process.env[key];
        else process.env[key] = original;
    }
});

describe('WDI design lab remains private', () => {
    it('returns a real SSR 404 on production, even with query string', async () => {
        process.env.APP_ENV = 'production';
        process.env.WDI_DESIGN_LAB_CI = 'false';
        expect(await getServerSideProps(context('cinematic'))).toEqual({ notFound: true });
    });

    it('does not allow a standalone CI flag without the local fixture', async () => {
        process.env.APP_ENV = 'production';
        process.env.CI = 'true';
        process.env.WDI_DESIGN_LAB_CI = 'true';
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = 'wdi-ci';
        process.env.API_BASE_URL = 'https://api.salon-bw.pl';
        expect(await getServerSideProps(context('atelier'))).toEqual({ notFound: true });
    });

    it('accepts all six variants and handles an unknown option safely on DEV', async () => {
        process.env.APP_ENV = 'development';
        for (const variant of ['editorial', 'cinematic', 'atelier', 'immersive', 'reel', 'orbit'] as const) {
            expect(await getServerSideProps(context(variant))).toEqual({
                props: { initialVariant: variant },
            });
        }
        expect(await getServerSideProps(context('anything-else'))).toEqual({
            props: { initialVariant: 'editorial' },
        });
    });

    it('allows the completely pinned synthetic CI environment', async () => {
        process.env.APP_ENV = 'production';
        process.env.CI = 'true';
        process.env.WDI_DESIGN_LAB_CI = 'true';
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV = 'wdi-ci';
        process.env.API_BASE_URL = 'http://127.0.0.1:43177';
        expect(await getServerSideProps(context('cinematic'))).toEqual({
            props: { initialVariant: 'cinematic' },
        });
    });
});

describe('WDI design directions keep the service and booking flow', () => {
    it('switches between six distinct compositions without losing the catalog', () => {
        render(<DesignLab initialVariant="editorial" />);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('BLACK&WHITE');
        const links = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
        expect(links).toContain('/services?offer=care');

        fireEvent.click(screen.getByRole('button', { name: /02 \/ Cinematic Monochrome/ }));
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Forma\. Światło\./);
        expect(screen.getAllByRole('link').map((link) => link.getAttribute('href')))
            .toContain('/services?offer=extensions');

        fireEvent.click(screen.getByRole('button', { name: /03 \/ Swiss Atelier/ }));
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Włosy\./);
        expect(screen.getAllByRole('link').map((link) => link.getAttribute('href')))
            .toContain('/services?offer=hairdressing');

        fireEvent.click(screen.getByRole('button', { name: /04 \/ Immersive Experience/ }));
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Zobacz włosy/);
        expect(screen.getByRole('heading', { level: 2, name: /Nie tylko fryzura/ })).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /Powiększ zdjęcie/ })).toHaveLength(6);
        fireEvent.click(screen.getByRole('button', { name: /05 \/ Motion Reel/ }));
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Sztuka ma/);
        expect(screen.getAllByRole('button', { name: /Otwórz fotografię/ })).toHaveLength(6);

        fireEvent.click(screen.getByRole('button', { name: /06 \/ Spatial Atelier/ }));
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Perspektywa/);
        expect(screen.getByRole('button', { name: /Obróć w prawo/ })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Obróć w prawo/ }));
        expect(screen.getByRole('heading', { level: 2, name: /Stylizacja/ })).toBeInTheDocument();

    });

    it('opens the canonical booking modal in the selected variant', () => {
        render(<DesignLab initialVariant="cinematic" />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Umów wizytę/ }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
