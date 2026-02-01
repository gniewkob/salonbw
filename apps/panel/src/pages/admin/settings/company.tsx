'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchSettings, useSettingsMutations } from '@/hooks/useSettings';
import type { UpdateBranchSettingsRequest } from '@/types';

type Tab = 'company' | 'address' | 'contact' | 'social' | 'tax' | 'gdpr';

export default function CompanySettingsPage() {
    const { user } = useAuth();
    const { data: settings, isLoading } = useBranchSettings();
    const { updateBranchSettings } = useSettingsMutations();

    const [activeTab, setActiveTab] = useState<Tab>('company');
    const [formData, setFormData] = useState<UpdateBranchSettingsRequest>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (settings) {
            setFormData({
                companyName: settings.companyName,
                displayName: settings.displayName ?? '',
                nip: settings.nip ?? '',
                regon: settings.regon ?? '',
                street: settings.street ?? '',
                buildingNumber: settings.buildingNumber ?? '',
                apartmentNumber: settings.apartmentNumber ?? '',
                postalCode: settings.postalCode ?? '',
                city: settings.city ?? '',
                country: settings.country ?? 'Polska',
                phone: settings.phone ?? '',
                phoneSecondary: settings.phoneSecondary ?? '',
                email: settings.email ?? '',
                website: settings.website ?? '',
                facebookUrl: settings.facebookUrl ?? '',
                instagramUrl: settings.instagramUrl ?? '',
                tiktokUrl: settings.tiktokUrl ?? '',
                logoUrl: settings.logoUrl ?? '',
                primaryColor: settings.primaryColor,
                currency: settings.currency,
                locale: settings.locale,
                timezone: settings.timezone,
                defaultVatRate: settings.defaultVatRate,
                isVatPayer: settings.isVatPayer,
                receiptFooter: settings.receiptFooter ?? '',
                invoiceNotes: settings.invoiceNotes ?? '',
                invoicePaymentDays: settings.invoicePaymentDays,
                gdprDataRetentionDays: settings.gdprDataRetentionDays,
                gdprConsentText: settings.gdprConsentText ?? '',
            });
        }
    }, [settings]);

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Brak dostępu</p>
            </div>
        );
    }

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                type === 'checkbox'
                    ? (e.target as HTMLInputElement).checked
                    : type === 'number'
                      ? parseFloat(value) || 0
                      : value,
        }));
        setSaved(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateBranchSettings.mutateAsync(formData);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const tabs: { key: Tab; label: string }[] = [
        { key: 'company', label: 'Dane firmy' },
        { key: 'address', label: 'Adres' },
        { key: 'contact', label: 'Kontakt' },
        { key: 'social', label: 'Media społecznościowe' },
        { key: 'tax', label: 'Podatki i faktury' },
        { key: 'gdpr', label: 'RODO' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Ustawienia firmy
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Zarządzaj danymi swojego salonu
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                        <span className="ml-3 text-gray-600">
                            Ładowanie ustawień...
                        </span>
                    </div>
                ) : (
                    <form
                        onSubmit={(event) => {
                            void handleSubmit(event);
                        }}
                    >
                        {/* Tabs */}
                        <div className="border-b border-gray-200 mb-6">
                            <nav className="-mb-px flex gap-4 overflow-x-auto">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                                            activeTab === tab.key
                                                ? 'border-primary-500 text-primary-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            {activeTab === 'company' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nazwa firmy *
                                            </label>
                                            <input
                                                type="text"
                                                name="companyName"
                                                value={
                                                    formData.companyName ?? ''
                                                }
                                                onChange={handleChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nazwa wyświetlana
                                            </label>
                                            <input
                                                type="text"
                                                name="displayName"
                                                value={
                                                    formData.displayName ?? ''
                                                }
                                                onChange={handleChange}
                                                placeholder="Opcjonalna krótsza nazwa"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                NIP
                                            </label>
                                            <input
                                                type="text"
                                                name="nip"
                                                value={formData.nip ?? ''}
                                                onChange={handleChange}
                                                placeholder="1234567890"
                                                maxLength={10}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                REGON
                                            </label>
                                            <input
                                                type="text"
                                                name="regon"
                                                value={formData.regon ?? ''}
                                                onChange={handleChange}
                                                placeholder="123456789"
                                                maxLength={14}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Logo URL
                                        </label>
                                        <input
                                            type="url"
                                            name="logoUrl"
                                            value={formData.logoUrl ?? ''}
                                            onChange={handleChange}
                                            placeholder="https://..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Kolor główny
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    name="primaryColor"
                                                    value={
                                                        formData.primaryColor ??
                                                        '#25B4C1'
                                                    }
                                                    onChange={handleChange}
                                                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={
                                                        formData.primaryColor ??
                                                        '#25B4C1'
                                                    }
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            primaryColor:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Waluta
                                            </label>
                                            <select
                                                name="currency"
                                                value={
                                                    formData.currency ?? 'PLN'
                                                }
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            >
                                                <option value="PLN">
                                                    PLN (zł)
                                                </option>
                                                <option value="EUR">
                                                    EUR (€)
                                                </option>
                                                <option value="USD">
                                                    USD ($)
                                                </option>
                                                <option value="GBP">
                                                    GBP (£)
                                                </option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Strefa czasowa
                                            </label>
                                            <select
                                                name="timezone"
                                                value={
                                                    formData.timezone ??
                                                    'Europe/Warsaw'
                                                }
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            >
                                                <option value="Europe/Warsaw">
                                                    Europa/Warszawa
                                                </option>
                                                <option value="Europe/London">
                                                    Europa/Londyn
                                                </option>
                                                <option value="Europe/Berlin">
                                                    Europa/Berlin
                                                </option>
                                                <option value="America/New_York">
                                                    Ameryka/Nowy Jork
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'address' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ulica
                                            </label>
                                            <input
                                                type="text"
                                                name="street"
                                                value={formData.street ?? ''}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Numer budynku
                                            </label>
                                            <input
                                                type="text"
                                                name="buildingNumber"
                                                value={
                                                    formData.buildingNumber ??
                                                    ''
                                                }
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Numer lokalu
                                            </label>
                                            <input
                                                type="text"
                                                name="apartmentNumber"
                                                value={
                                                    formData.apartmentNumber ??
                                                    ''
                                                }
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Kod pocztowy
                                            </label>
                                            <input
                                                type="text"
                                                name="postalCode"
                                                value={
                                                    formData.postalCode ?? ''
                                                }
                                                onChange={handleChange}
                                                placeholder="00-000"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Miasto
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city ?? ''}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Kraj
                                            </label>
                                            <input
                                                type="text"
                                                name="country"
                                                value={formData.country ?? ''}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'contact' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Telefon główny
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone ?? ''}
                                                onChange={handleChange}
                                                placeholder="+48 123 456 789"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Telefon dodatkowy
                                            </label>
                                            <input
                                                type="tel"
                                                name="phoneSecondary"
                                                value={
                                                    formData.phoneSecondary ??
                                                    ''
                                                }
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email ?? ''}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Strona internetowa
                                            </label>
                                            <input
                                                type="url"
                                                name="website"
                                                value={formData.website ?? ''}
                                                onChange={handleChange}
                                                placeholder="https://..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'social' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Facebook
                                        </label>
                                        <input
                                            type="url"
                                            name="facebookUrl"
                                            value={formData.facebookUrl ?? ''}
                                            onChange={handleChange}
                                            placeholder="https://facebook.com/..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Instagram
                                        </label>
                                        <input
                                            type="url"
                                            name="instagramUrl"
                                            value={formData.instagramUrl ?? ''}
                                            onChange={handleChange}
                                            placeholder="https://instagram.com/..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            TikTok
                                        </label>
                                        <input
                                            type="url"
                                            name="tiktokUrl"
                                            value={formData.tiktokUrl ?? ''}
                                            onChange={handleChange}
                                            placeholder="https://tiktok.com/@..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tax' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="isVatPayer"
                                            name="isVatPayer"
                                            checked={
                                                formData.isVatPayer ?? true
                                            }
                                            onChange={handleChange}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        />
                                        <label
                                            htmlFor="isVatPayer"
                                            className="text-sm text-gray-700"
                                        >
                                            Firma jest płatnikiem VAT
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Domyślna stawka VAT (%)
                                            </label>
                                            <input
                                                type="number"
                                                name="defaultVatRate"
                                                value={
                                                    formData.defaultVatRate ??
                                                    23
                                                }
                                                onChange={handleChange}
                                                min={0}
                                                max={100}
                                                step={0.01}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Termin płatności faktur (dni)
                                            </label>
                                            <input
                                                type="number"
                                                name="invoicePaymentDays"
                                                value={
                                                    formData.invoicePaymentDays ??
                                                    14
                                                }
                                                onChange={handleChange}
                                                min={1}
                                                max={90}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Stopka paragonu
                                        </label>
                                        <textarea
                                            name="receiptFooter"
                                            value={formData.receiptFooter ?? ''}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="Dodatkowy tekst na paragonie..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Uwagi na fakturze
                                        </label>
                                        <textarea
                                            name="invoiceNotes"
                                            value={formData.invoiceNotes ?? ''}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="Domyślne uwagi na fakturach..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'gdpr' && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h3 className="text-sm font-medium text-blue-800">
                                            Ochrona danych osobowych (RODO)
                                        </h3>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Skonfiguruj ustawienia związane z
                                            przetwarzaniem danych osobowych
                                            klientów zgodnie z przepisami RODO.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Okres przechowywania danych (dni)
                                        </label>
                                        <input
                                            type="number"
                                            name="gdprDataRetentionDays"
                                            value={
                                                formData.gdprDataRetentionDays ??
                                                1095
                                            }
                                            onChange={handleChange}
                                            min={30}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Domyślnie 1095 dni (3 lata). Dane
                                            klientów będą automatycznie
                                            anonimizowane po tym okresie.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tekst zgody RODO
                                        </label>
                                        <textarea
                                            name="gdprConsentText"
                                            value={
                                                formData.gdprConsentText ?? ''
                                            }
                                            onChange={handleChange}
                                            rows={5}
                                            placeholder="Wyrażam zgodę na przetwarzanie moich danych osobowych..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Save button */}
                        <div className="mt-6 flex justify-end gap-4">
                            {saved && (
                                <span className="flex items-center text-green-600 text-sm">
                                    <svg
                                        className="w-5 h-5 mr-1"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Zapisano
                                </span>
                            )}
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {saving && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                )}
                                Zapisz zmiany
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
