import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import RegisterPage from '@/pages/auth/register';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('next/router', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), asPath: '/' }),
}));
jest.mock('@/contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const GDPR_REQUIRED = 'Zgoda na przetwarzanie danych osobowych jest wymagana';

describe('RegisterPage consents', () => {
    beforeEach(() => {
        mockedUseAuth.mockReturnValue(createAuthValue({}));
    });

    it('does not flag a checked GDPR consent as missing when it loses focus', () => {
        render(<RegisterPage />);

        // A client fills the form first: leaving the password field validates
        // the whole form while GDPR is still unchecked.
        const password = screen.getByLabelText('Hasło');
        fireEvent.change(password, { target: { value: 'Klientka-2026!' } });
        fireEvent.blur(password);

        // ...then ticks GDPR and moves on, which blurs the checkbox.
        const gdpr = screen.getByRole('checkbox', {
            name: /przetwarzanie moich danych osobowych/i,
        });
        fireEvent.click(gdpr);
        fireEvent.blur(gdpr);

        expect(gdpr).toBeChecked();
        // A stale "required" error here would sit between the two consents and
        // push the terms checkbox down mid-click, so the click missed it.
        expect(screen.queryByText(GDPR_REQUIRED)).toBeNull();
    });

    it('still reports a missing GDPR consent once it is touched unchecked', () => {
        render(<RegisterPage />);

        const gdpr = screen.getByRole('checkbox', {
            name: /przetwarzanie moich danych osobowych/i,
        });
        fireEvent.blur(gdpr);

        expect(screen.getByText(GDPR_REQUIRED)).toBeInTheDocument();
    });

    it('clears the GDPR error as soon as the consent is given', () => {
        render(<RegisterPage />);

        const gdpr = screen.getByRole('checkbox', {
            name: /przetwarzanie moich danych osobowych/i,
        });
        fireEvent.blur(gdpr);
        expect(screen.getByText(GDPR_REQUIRED)).toBeInTheDocument();

        fireEvent.click(gdpr);

        expect(screen.queryByText(GDPR_REQUIRED)).toBeNull();
    });
});
