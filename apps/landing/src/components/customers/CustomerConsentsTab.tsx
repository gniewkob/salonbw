'use client';

import { Customer } from '@/types';

interface Props {
    customer: Customer;
    onUpdate?: (data: Partial<Customer>) => void;
}

export default function CustomerConsentsTab({ customer, onUpdate }: Props) {
    const handleConsentChange = (field: keyof Customer, value: boolean) => {
        if (onUpdate) {
            const updateData: Partial<Customer> = { [field]: value };

            // If enabling GDPR consent, also set the consent date
            if (field === 'gdprConsent' && value) {
                updateData.gdprConsentDate = new Date().toISOString();
            }

            onUpdate(updateData);
        }
    };

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">
                Zgody i preferencje
            </h3>

            {/* GDPR Consent */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h4 className="mb-4 text-sm font-semibold text-gray-700">
                    Zgoda RODO
                </h4>
                <div className="space-y-4">
                    <label className="flex cursor-pointer items-start gap-3">
                        <input
                            type="checkbox"
                            checked={customer.gdprConsent}
                            onChange={(e) =>
                                handleConsentChange('gdprConsent', e.target.checked)
                            }
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <div>
                            <span className="font-medium text-gray-700">
                                Wyrażam zgodę na przetwarzanie danych osobowych
                            </span>
                            <p className="mt-1 text-sm text-gray-500">
                                Zgoda na przetwarzanie danych osobowych w celach związanych
                                z realizacją usług salonu zgodnie z RODO.
                            </p>
                        </div>
                    </label>
                    {customer.gdprConsentDate && (
                        <div className="ml-7 text-sm text-gray-500">
                            Data wyrażenia zgody: {formatDate(customer.gdprConsentDate)}
                        </div>
                    )}
                </div>
            </div>

            {/* Marketing Consents */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h4 className="mb-4 text-sm font-semibold text-gray-700">
                    Zgody marketingowe
                </h4>
                <div className="space-y-4">
                    <label className="flex cursor-pointer items-start gap-3">
                        <input
                            type="checkbox"
                            checked={customer.smsConsent}
                            onChange={(e) =>
                                handleConsentChange('smsConsent', e.target.checked)
                            }
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <div>
                            <span className="font-medium text-gray-700">
                                Zgoda na SMS
                            </span>
                            <p className="mt-1 text-sm text-gray-500">
                                Wyrażam zgodę na otrzymywanie wiadomości SMS z
                                przypomnieniami o wizytach oraz ofertami promocyjnymi.
                            </p>
                        </div>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3">
                        <input
                            type="checkbox"
                            checked={customer.emailConsent}
                            onChange={(e) =>
                                handleConsentChange('emailConsent', e.target.checked)
                            }
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        <div>
                            <span className="font-medium text-gray-700">
                                Zgoda na e-mail
                            </span>
                            <p className="mt-1 text-sm text-gray-500">
                                Wyrażam zgodę na otrzymywanie wiadomości e-mail z
                                informacjami o nowościach, promocjach i newsletterach.
                            </p>
                        </div>
                    </label>
                </div>
            </div>

            {/* Privacy Information */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                <h4 className="mb-2 text-sm font-semibold text-blue-800">
                    ℹ️ Informacja o przetwarzaniu danych
                </h4>
                <div className="space-y-2 text-sm text-blue-700">
                    <p>
                        Administratorem danych osobowych jest właściciel salonu. Dane
                        przetwarzane są w celu realizacji usług oraz, za zgodą, w celach
                        marketingowych.
                    </p>
                    <p>
                        Klient ma prawo do: dostępu do swoich danych, ich sprostowania,
                        usunięcia, ograniczenia przetwarzania, przenoszenia oraz
                        wniesienia sprzeciwu wobec przetwarzania.
                    </p>
                    <p>
                        W każdej chwili można wycofać zgodę kontaktując się z recepcją
                        salonu lub poprzez panel klienta.
                    </p>
                </div>
            </div>

            {/* Consent History (placeholder) */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h4 className="mb-4 text-sm font-semibold text-gray-700">
                    Historia zmian zgód
                </h4>
                <div className="text-sm text-gray-500">
                    <table className="w-full">
                        <thead className="border-b">
                            <tr>
                                <th className="py-2 text-left font-medium">Data</th>
                                <th className="py-2 text-left font-medium">Zgoda</th>
                                <th className="py-2 text-left font-medium">Zmiana</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customer.gdprConsentDate && (
                                <tr className="border-b">
                                    <td className="py-2">
                                        {formatDate(customer.gdprConsentDate)}
                                    </td>
                                    <td className="py-2">RODO</td>
                                    <td className="py-2">
                                        <span className="text-green-600">Wyrażono zgodę</span>
                                    </td>
                                </tr>
                            )}
                            <tr>
                                <td className="py-2" colSpan={3}>
                                    {!customer.gdprConsentDate && (
                                        <span className="text-gray-400">
                                            Brak zapisanej historii
                                        </span>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
