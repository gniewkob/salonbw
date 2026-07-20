import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import GalleryPage from '@/pages/gallery';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Gallery lightbox', () => {
    beforeEach(() => {
        mockedUseAuth.mockReturnValue(createAuthValue());
        // analytics guard
        // @ts-expect-error jsdom window doesn't define gtag
        window.gtag = jest.fn();
        process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = 'true';
        process.env.NEXT_PUBLIC_GA_ID = 'G-TEST123';
        window.localStorage.setItem(
            'sbw-consent',
            JSON.stringify({
                analytics: 'granted',
                decidedAt: new Date().toISOString(),
            }),
        );
    });
    afterEach(() => {
        // @ts-expect-error jsdom window doesn't define gtag
        delete window.gtag;
    });

    it('opens and closes lightbox on click', () => {
        render(
            <GalleryPage
                items={[
                    { id: '1', imageUrl: '/img1.jpg', caption: 'One' },
                    { id: '2', imageUrl: '/img2.jpg', caption: 'Two' },
                ]}
            />,
        );
        fireEvent.click(screen.getByLabelText(/one/i));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText('Zamknij'));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows unavailable gallery state without local sample photos', () => {
        render(<GalleryPage items={[]} nextCursor={null} fallback />);

        expect(
            screen.getByText(/Galeria Instagram jest chwilowo niedostępna/i),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /Otwórz zdjęcie/i }),
        ).not.toBeInTheDocument();
    });

    it('has share button and calls navigator.share when available', () => {
        const shareMock = jest.fn();
        // @ts-expect-error jsdom navigator doesn't expose share
        navigator.share = shareMock;
        render(
            <GalleryPage
                items={[{ id: '1', imageUrl: '/img1.jpg', caption: 'One' }]}
            />,
        );
        fireEvent.click(screen.getByLabelText(/one/i));
        const share = screen.getByLabelText('Udostępnij zdjęcie');
        fireEvent.click(share);
        expect(shareMock).toHaveBeenCalled();
        // cleanup
        // @ts-expect-error jsdom navigator doesn't expose share
        delete navigator.share;
    });

    it('emits next/prev and download analytics', () => {
        // @ts-expect-error jsdom window doesn't define gtag
        window.gtag = jest.fn();
        render(
            <GalleryPage
                items={[
                    { id: '1', imageUrl: '/img1.jpg', caption: 'One' },
                    { id: '2', imageUrl: '/img2.jpg', caption: 'Two' },
                ]}
            />,
        );
        fireEvent.click(screen.getByLabelText(/one/i));
        // use keyboard to navigate next/prev
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        fireEvent.keyDown(document, { key: 'ArrowLeft' });
        fireEvent.click(screen.getByLabelText('Pobierz zdjęcie'));
        const calls = (window.gtag as jest.Mock).mock.calls.map((c) => c[1]);
        expect(calls).toContain('lightbox_next');
        expect(calls).toContain('lightbox_prev');
        expect(calls).toContain('lightbox_download');
    });
});
