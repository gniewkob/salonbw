import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useEmployee } from '@/hooks/useEmployees';
import { useUpdateEmployee } from '@/hooks/useEmployees';

const NAV = (
    <div className="sidenav secondarynav" id="sidenav">
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

export default function SettingsEmployeeEditPage() {
    const router = useRouter();
    const id = router.query.id ? Number(router.query.id) : null;
    useSetSecondaryNav(NAV);

    const { data: employee, isLoading } = useEmployee(id);
    const updateEmployee = useUpdateEmployee();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    useEffect(() => {
        if (employee) {
            const parts = employee.name.split(' ');
            setFirstName(parts[0] ?? '');
            setLastName(parts.slice(1).join(' ') ?? '');
        }
    }, [employee]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        await updateEmployee.mutateAsync({
            id,
            firstName,
            lastName,
        });
        void router.push(`/settings/employees/${id}`);
    };

    return (
        <div className="settings-detail-layout" data-testid="settings-detail">
            <aside className="settings-detail-layout__sidebar">{NAV}</aside>
            <div className="settings-detail-layout__main">
                <div className="breadcrumbs" e2e-breadcrumbs="">
                    <ul>
                        <li>
                            <div className="icon sprite-breadcrumbs_settings" />
                            <Link href="/settings">Ustawienia</Link>
                        </li>
                        <li>
                            <span> / </span>
                            <Link href="/settings/employees">Pracownicy</Link>
                        </li>
                        <li>
                            <span> / </span>
                            {employee?.name ?? '...'}
                        </li>
                        <li>
                            <span> / </span>
                            Edytuj
                        </li>
                    </ul>
                </div>
                <div className="inner edit_branch_form">
                    {isLoading ? (
                        <p>Ładowanie...</p>
                    ) : (
                        <form onSubmit={(e) => void handleSubmit(e)}>
                            <h2>Edytuj pracownika</h2>
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
                                    disabled={updateEmployee.isPending}
                                >
                                    {updateEmployee.isPending
                                        ? 'Zapisywanie...'
                                        : 'Zapisz'}
                                </button>
                                <Link
                                    href={
                                        id
                                            ? `/settings/employees/${id}`
                                            : '/settings/employees'
                                    }
                                    className="btn btn-default"
                                    style={{ marginLeft: 8 }}
                                >
                                    Anuluj
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
