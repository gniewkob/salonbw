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
        // @ts-ignore
        window.gtag = jest.fn();
    });
    afterEach(() => {
        // @ts-ignore
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
        fireEvent.click(screen.getByLabelText('Open image 1'));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText('Close'));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});

