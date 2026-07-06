import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HelpContactPage from '@/components/help/HelpContactPage';
import { useAuth } from '@/contexts/AuthContext';
import { createAuthValue } from '../testUtils';

jest.mock('@/contexts/AuthContext');
jest.mock('@/contexts/SecondaryNavContext', () => ({
    useSetSecondaryNav: jest.fn(),
}));
jest.mock('@/hooks/useBranches', () => ({
    useMyPrimaryBranch: () => ({
        data: {
            id: 7,
            name: 'Salon Black & White',
            phone: '123 456 789',
            email: 'salon@example.test',
        },
    }),
}));
jest.mock('@/components/salon/SalonBreadcrumbs', () => ({
    __esModule: true,
    default: ({ items }: { items: Array<{ label: string }> }) => (
        <nav aria-label="breadcrumbs">
            {items.map((item) => (
                <span key={item.label}>{item.label}</span>
            ))}
        </nav>
    ),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('HelpContactPage', () => {
    it('uses SalonBW help copy and account data instead of Versum content', () => {
        mockedUseAuth.mockReturnValue(
            createAuthValue({
                isAuthenticated: true,
                role: 'client',
                user: {
                    id: 42,
                    email: 'client@example.test',
                    name: 'Klient',
                    role: 'client',
                },
            }),
        );

        render(<HelpContactPage />);

        expect(
            screen.getByRole('heading', {
                name: 'Centrum pomocy Salon Black & White',
            }),
        ).toBeInTheDocument();
        expect(screen.getAllByText('Konto #42')).toHaveLength(2);
        expect(screen.getByText('123 456 789')).toBeInTheDocument();
        expect(screen.queryByText(/Baza wiedzy/i)).not.toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: /Bazy Wiedzy/i }),
        ).not.toBeInTheDocument();
        expect(screen.queryByText(/19581/)).not.toBeInTheDocument();
    });

    it('sends the contact form with derived account and branch details', async () => {
        const apiFetch = jest.fn(async () => ({ status: 'ok' }));
        mockedUseAuth.mockReturnValue(
            createAuthValue({
                isAuthenticated: true,
                role: 'client',
                apiFetch: apiFetch as never,
                user: {
                    id: 42,
                    email: 'client@example.test',
                    name: 'Klient',
                    role: 'client',
                },
            }),
        );

        render(<HelpContactPage />);

        fireEvent.change(screen.getByLabelText('Pytanie'), {
            target: { value: 'Nie widzę mojej wizyty' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'wyślij pytanie' }));

        await waitFor(() => {
            expect(apiFetch).toHaveBeenCalledWith(
                '/emails/send-auth',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"accountLabel":"Konto #42"'),
                }),
            );
        });

        const [, request] = apiFetch.mock.calls[0];
        const payload = JSON.parse(String(request?.body));
        expect(payload.to).toBe('salon@example.test');
        expect(payload.subject).toBe(
            'Panel pomoc: Salon Black & White (Konto #42)',
        );
        expect(payload.data).toMatchObject({
            accountId: 42,
            accountLabel: 'Konto #42',
            branchName: 'Salon Black & White',
            replyEmail: 'client@example.test',
            query: 'Nie widzę mojej wizyty',
        });
    });
});
