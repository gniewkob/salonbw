import { render, waitFor } from '@testing-library/react';
import React from 'react';
import HomePage from '@/pages/index';
const replace = jest.fn();
jest.mock('next/router', () => ({
    useRouter: () => ({ replace }),
}));

describe('Home redirect', () => {
    beforeEach(() => {
        replace.mockClear();
    });

    it('redirects to dashboard', async () => {
        render(<HomePage />);
        await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
    });
});
