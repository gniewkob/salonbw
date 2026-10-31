import { fireEvent, render, screen } from '@testing-library/react';
import SplitHero from '@/components/SplitHero';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');
jest.mock('@/components/NearestSlotTeaser', () => {
    return function MockNearestSlotTeaser() {
        return null;
    };
});

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('WDI editorial home hero', () => {
    beforeEach(() => {
        mockedUseAuth.mockReturnValue(createAuthValue());
    });

    it('keeps a semantic labelled heading and the existing service discovery route', () => {
        const { container } = render(<SplitHero />);
        const hero = container.querySelector('.split-hero');
        const heading = screen.getByRole('heading', { level: 1 });

        expect(hero).toHaveAttribute('aria-labelledby', heading.id);
        expect(heading).toHaveTextContent(/Black\s*&\s*White/i);
        expect(
            screen.getByRole('link', { name: 'Odkryj usługi' }),
        ).toHaveAttribute('href', '/services');
    });

    it('preserves the existing booking action and modal', () => {
        render(<SplitHero />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Umów wizytę' }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('uses a responsive first-party image without mandatory zoom animation', () => {
        render(<SplitHero />);
        const image = screen.getByRole('img', {
            name: 'Wnętrze salonu Black & White',
        });
        expect(image).toHaveAttribute(
            'sizes',
            '(max-width: 768px) 100vw, 48vw',
        );
        expect(image).not.toHaveClass('hero-img-zoom');
    });
});
