import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PanelSection from '@/components/ui/PanelSection';
import type { Employee } from '@/types';

const NAV = (
    <div className="sidenav" id="sidenav">
        <div className="column_row tree other_settings">
            <h4>Pracownicy</h4>
            <ul>
                <li>
                    <Link href="/settings/employees">
                        <div className="icon_box">
                            <span className="icon sprite-settings_employees_nav" />
                        </div>
                        Lista pracowników
                    </Link>
                </li>
            </ul>
        </div>
    </div>
);

function useCreateEmployee() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { firstName: string; lastName: string }) =>
            apiFetch<Employee>('/employees', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });
}

export default function SettingsEmployeeNewPage() {
    const router = useRouter();
    const { role } = useAuth();
    useSetSecondaryNav(NAV);
    const createEmployee = useCreateEmployee();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    if (!role) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const created = await createEmployee.mutateAsync({
            firstName,
            lastName,
        });
        void router.push(`/settings/employees/${created.id}`);
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <div
                    className="settings-detail-layout"
                    data-testid="settings-detail"
                >
                    <aside className="settings-detail-layout__sidebar">
                        {NAV}
                    </aside>
                    <div className="settings-detail-layout__main">
                        <SalonBreadcrumbs
                            iconClass="sprite-breadcrumbs_settings"
                            items={[
                                { label: 'Ustawienia', href: '/settings' },
                                {
                                    label: 'Pracownicy',
                                    href: '/settings/employees',
                                },
                                { label: 'Nowy pracownik' },
                            ]}
                        />
                        <PanelSection>
                            <form onSubmit={(e) => void handleSubmit(e)}>
                                <h2>Dodaj pracownika</h2>
                                <div className="form-group">
                                    <label
                                        htmlFor="firstName"
                                        className="control-label"
                                    >
                                        Imię
                                    </label>
                                    <input
                                        id="firstName"
                                        type="text"
                                        className="form-control"
                                        value={firstName}
                                        onChange={(e) =>
                                            setFirstName(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label
                                        htmlFor="lastName"
                                        className="control-label"
                                    >
                                        Nazwisko
                                    </label>
                                    <input
                                        id="lastName"
                                        type="text"
                                        className="form-control"
                                        value={lastName}
                                        onChange={(e) =>
                                            setLastName(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <button
                                        type="submit"
                                        className="btn button-blue"
                                        disabled={createEmployee.isPending}
                                    >
                                        {createEmployee.isPending
                                            ? 'Zapisywanie...'
                                            : 'Dodaj pracownika'}
                                    </button>
                                    <Link
                                        href="/settings/employees"
                                        className="btn btn-default"
                                        style={{ marginLeft: 8 }}
                                    >
                                        Anuluj
                                    </Link>
                                </div>
                            </form>
                        </PanelSection>
                    </div>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}
