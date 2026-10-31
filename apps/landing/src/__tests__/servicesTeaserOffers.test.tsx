import { render, screen } from '@testing-library/react';
import ServicesTeaser from '@/components/ServicesTeaser';

describe('ServicesTeaser contextual navigation', () => {
    it('links each editorial card to an offer key instead of generic services', () => {
        render(<ServicesTeaser />);

        expect(
            screen.getByRole('link', { name: /Fryzjerstwo/i }),
        ).toHaveAttribute('href', '/services?offer=hairdressing');
        expect(
            screen.getByRole('link', { name: /Akademia Pielęgnacji/i }),
        ).toHaveAttribute('href', '/services?offer=care');
        expect(
            screen.getByRole('link', { name: /Przedłużanie Włosów/i }),
        ).toHaveAttribute('href', '/services?offer=extensions');

        expect(
            screen.getByRole('link', { name: /Pełna oferta usług/i }),
        ).toHaveAttribute('href', '/services');
    });
});
