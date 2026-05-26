import { render } from '@testing-library/react';
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
        // @ts-expect-error jsdom window doesn't define gtag
        window.gtag = jest.fn();
        mockedUseAuth.mockReturnValue(createAuthValue());
    });

    afterEach(() => {
        // @ts-expect-error jsdom window doesn't define gtag
        delete window.gtag;
    });

    it('emits page_view for home page', () => {
        render(<HomePage />);
        const calls = (window.gtag as jest.Mock).mock.calls;
        expect(
            calls.find(
                (c) =>
                    c[1] === 'page_view' &&
                    c[2]?.page_title === 'Home',
            ),
        ).toBeTruthy();
    });
});
