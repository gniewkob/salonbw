import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import HomePage from '@/pages/index';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Home analytics', () => {
    beforeEach(() => {
        process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = 'true';
        process.env.NEXT_PUBLIC_GA_ID = 'G-TEST123';
        // @ts-ignore
        window.gtag = jest.fn();
        mockedUseAuth.mockReturnValue(createAuthValue());
    });

    afterEach(() => {
        // @ts-ignore
        delete window.gtag;
    });

    it('emits view_item_list for featured services and gallery, and select_item on clicks', () => {
        render(<HomePage />);
        // @ts-ignore
        const calls = (window.gtag as jest.Mock).mock.calls;
        expect(calls.find((c) => c[1] === 'view_item_list' && c[2]?.item_list_name === 'home_featured_services')).toBeTruthy();
        expect(calls.find((c) => c[1] === 'view_item_list' && c[2]?.item_list_name === 'home_gallery')).toBeTruthy();

        // Click Coloring card
        fireEvent.click(screen.getByText('Coloring'));
        // @ts-ignore
        const after = (window.gtag as jest.Mock).mock.calls;
        expect(after.find((c) => c[1] === 'select_item')).toBeTruthy();

        // Click first gallery image button by aria-label
        fireEvent.click(screen.getByLabelText('View gallery image 1'));
        // @ts-ignore
        const after2 = (window.gtag as jest.Mock).mock.calls;
        const gallerySelect = after2.filter((c) => c[1] === 'select_item' && c[2]?.item_list_name === 'home_gallery');
        expect(gallerySelect.length).toBeGreaterThanOrEqual(1);
    });
});
