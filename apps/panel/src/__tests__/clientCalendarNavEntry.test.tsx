import { render, screen } from '@testing-library/react';
import ClientSidebarMenu from '@/components/sidebars/ClientSidebarMenu';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '@/testUtils';

jest.mock('@/contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Client calendar nav entry point', () => {
    beforeEach(() => {
        mockedUseAuth.mockReset();
    });

    it('renders client link to client calendar view', () => {
        mockedUseAuth.mockReturnValue(
            createAuthValue({
                role: 'client',
            }),
        );

        render(<ClientSidebarMenu open />);

        const link = screen.getByTestId('nav-appointments');
        expect(link).toHaveAttribute('href', '/calendar?view=client');
        expect(link).toHaveTextContent('Moje wizyty');
    });
});
