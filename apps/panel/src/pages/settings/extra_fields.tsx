import Link from 'next/link';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import CustomerSettingsNav from '@/components/settings/CustomerSettingsNav';

const NAV = <CustomerSettingsNav />;

type FieldType = 'text' | 'number' | 'date' | 'checkbox' | 'select';

interface ExtraField {
    id: number;
    label: string;
    type: FieldType;
    required: boolean;
}

const MOCK_FIELDS: ExtraField[] = [
    { id: 1, label: 'Data urodzenia', type: 'date', required: false },
    {
        id: 2,
        label: 'Numer karty lojalnościowej',
        type: 'text',
        required: false,
    },
];

const TYPE_LABELS: Record<FieldType, string> = {
    text: 'Tekst',
    number: 'Liczba',
    date: 'Data',
    checkbox: 'Pole wyboru',
    select: 'Lista',
};

export default function SettingsExtraFieldsPage() {
    useSetSecondaryNav(NAV);

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
                    </ul>
                </div>
                <div className="inner edit_branch_form">
                    <div className="actions">
                        <button
                            type="button"
                            className="btn button-blue pull-right"
                            disabled
                        >
                            + dodaj pole
                        </button>
                    </div>
                    <h2>Klienci — dodatkowe pola</h2>
                    <p className="text-muted">
                        Dodatkowe pola pojawiają się na karcie klienta.
                    </p>
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>
                                    <div>Etykieta</div>
                                </th>
                                <th>
                                    <div>Typ</div>
                                </th>
                                <th>
                                    <div>Wymagane</div>
                                </th>
                                <th>
                                    <div>Akcje</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_FIELDS.map((field, i) => (
                                <tr
                                    key={field.id}
                                    className={i % 2 === 0 ? 'even' : 'odd'}
                                >
                                    <td>{field.label}</td>
                                    <td>{TYPE_LABELS[field.type]}</td>
                                    <td>{field.required ? 'Tak' : 'Nie'}</td>
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
