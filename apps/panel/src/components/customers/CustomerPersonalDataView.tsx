'use client';

import type { Customer } from '@/types';

interface Props {
    customer: Customer;
}

function valueOrNotProvided(value?: string | null): string {
    if (!value || !value.trim()) return 'nie podano';
    return value;
}

function formatDate(value?: string | null): string {
    if (!value) return 'nie podano';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('pl-PL');
}

function formatDateTime(value?: string | null): string {
    if (!value) return 'nie podano';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('pl-PL');
}

function formatGender(gender?: Customer['gender']): string {
    if (!gender) return 'nie podano';
    if (gender === 'female') return 'kobieta';
    if (gender === 'male') return 'mężczyzna';
    return 'inna';
}

export default function CustomerPersonalDataView({ customer }: Props) {
    return (
        <div className="customer-personal-view">
            <div className="customer-personal-view__col">
                <h4>dane podstawowe</h4>
                <dl className="customer-personal-view__list">
                    <div>
                        <dt>Imię</dt>
                        <dd>{valueOrNotProvided(customer.firstName)}</dd>
                    </div>
                    <div>
                        <dt>Nazwisko</dt>
                        <dd>{valueOrNotProvided(customer.lastName)}</dd>
                    </div>
                    <div>
                        <dt>Płeć</dt>
                        <dd>{formatGender(customer.gender)}</dd>
                    </div>
                    <div>
                        <dt>Email</dt>
                        <dd>{valueOrNotProvided(customer.email)}</dd>
                    </div>
                    <div>
                        <dt>Telefon</dt>
                        <dd>{valueOrNotProvided(customer.phone)}</dd>
                    </div>
                </dl>
            </div>
            <div className="customer-personal-view__col">
                <h4>dane rozszerzone</h4>
                <dl className="customer-personal-view__list">
                    <div>
                        <dt>Data urodzenia</dt>
                        <dd>{formatDate(customer.birthDate)}</dd>
                    </div>
                    <div>
                        <dt>Adres (ulica, nr)</dt>
                        <dd>{valueOrNotProvided(customer.address)}</dd>
                    </div>
                    <div>
                        <dt>Kod pocztowy</dt>
                        <dd>{valueOrNotProvided(customer.postalCode)}</dd>
                    </div>
                    <div>
                        <dt>Miasto</dt>
                        <dd>{valueOrNotProvided(customer.city)}</dd>
                    </div>
                    <div>
                        <dt>Kraj</dt>
                        <dd>Polska</dd>
                    </div>
                    <div>
                        <dt>Należy do grup</dt>
                        <dd>
                            {customer.groups?.length
                                ? customer.groups.map((g) => g.name).join(', ')
                                : 'nie podano'}
                        </dd>
                    </div>
                    <div>
                        <dt>Opis</dt>
                        <dd>{valueOrNotProvided(customer.description)}</dd>
                    </div>
                    <div>
                        <dt>Data dodania</dt>
                        <dd>{formatDateTime(customer.createdAt)}</dd>
                    </div>
                    <div>
                        <dt>Ostatnia modyfikacja</dt>
                        <dd>{formatDateTime(customer.updatedAt)}</dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}
