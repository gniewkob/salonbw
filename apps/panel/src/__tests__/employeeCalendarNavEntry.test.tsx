import { render, screen } from '@testing-library/react';
import EmployeeSidebarMenu from '@/components/sidebars/EmployeeSidebarMenu';
import AdminSidebarMenu from '@/components/sidebars/AdminSidebarMenu';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '@/testUtils';

jest.mock('@/contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Employee calendar nav entry point', () => {
    beforeEach(() => {
        mockedUseAuth.mockReset();
    });

    it('renders employee link to employee calendar view', () => {
        mockedUseAuth.mockReturnValue(
            createAuthValue({
                role: 'employee',
            }),
        );

        render(<EmployeeSidebarMenu open />);

        const link = screen.getByTestId('nav-employee-calendar');
        expect(link).toHaveAttribute('href', '/calendar?view=employee');
        expect(link).toHaveTextContent('Kalendarz pracownika');
    });

    it('renders admin link to employee calendar view', () => {
        mockedUseAuth.mockReturnValue(
            createAuthValue({
                role: 'admin',
            }),
        );

        render(<AdminSidebarMenu open />);

        const link = screen.getByTestId('nav-employee-calendar');
        expect(link).toHaveAttribute('href', '/calendar?view=employee');
        expect(link).toHaveTextContent('Kalendarz pracownika');
    });
});
