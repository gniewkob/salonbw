import Link from 'next/link';
import { useState } from 'react';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import CustomerSettingsNav from '@/components/settings/CustomerSettingsNav';

const NAV = <CustomerSettingsNav />;

const DEFAULT_ORIGINS = [
    'Facebook',
    'Instagram',
    'Polecenie znajomego',
    'Google',
    'Ulotka',
    'Strona internetowa',
    'Inne',
];

export default function SettingsCustomerOriginsPage() {
    useSetSecondaryNav(NAV);

    const [origins] = useState<string[]>(DEFAULT_ORIGINS);

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
                            Klienci
                        </li>
                        <li>
                            <span> / </span>
                            Pochodzenie klientów
                        </li>
                    </ul>
                </div>
                <div className="inner edit_branch_form">
                    <div className="actions">
                        <button
                            type="button"
                            className="btn button-blue pull-right"
                            disabled
                        >
                            + dodaj źródło
                        </button>
                    </div>
                    <h2>Pochodzenie klientów</h2>
                    <p className="text-muted">
                        Lista źródeł, z których klienci trafiają do salonu.
                    </p>
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>
                                    <div>Nazwa źródła</div>
                                </th>
                                <th>
                                    <div>Akcje</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {origins.map((origin, i) => (
                                <tr
                                    key={origin}
                                    className={i % 2 === 0 ? 'even' : 'odd'}
                                >
                                    <td>{origin}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="btn-group">
                                            <button
                                                type="button"
                                                className="btn btn-xs btn-default"
                                                disabled
                                            >
                                                edytuj
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-xs btn-default"
                                                disabled
                                            >
                                                usuń
                                            </button>
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
