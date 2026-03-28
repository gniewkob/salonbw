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
            <div className="d-d-flex align-align-items-center justify-content-center">
                <p className="text-muted">Brak dostępu</p>
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
        <div className="bg-light">
            <div className="mx-auto py-3 px-3">
                <div className="mb-3">
                    <h1 className="fs-3 fw-bold text-dark">Ustawienia firmy</h1>
                    <p className="mt-1 small text-muted">
                        Zarządzaj danymi swojego salonu
                    </p>
                </div>

                {isLoading ? (
                    <div className="d-d-flex align-align-items-center justify-content-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary"></div>
                        <span className="ms-2 text-muted">
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
                        <div className="border-bottom mb-3">
                            <nav className="-mb-px d-d-flex gap-3 overflow-auto">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`py-2 px-1 border-bottom border border-2 fw-medium small text-nowrap ${
                                            activeTab === tab.key
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-muted border-opacity-50'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="bg-white rounded-3 shadow p-3">
                            {activeTab === 'company' && (
                                <div className="">
                                    <div className="row g-4">
                                        <div>
                                            <label className="form-label">
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
                                                className="form-control"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">
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
                                                className="form-control"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">
                                                NIP
                                            </label>
                                            <input
                                                type="text"
                                                name="nip"
                                                value={formData.nip ?? ''}
                                                onChange={handleChange}
                                                placeholder="1234567890"
                                                maxLength={10}
                                                className="form-control"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">
                                                REGON
                                            </label>
                                            <input
                                                type="text"
                                                name="regon"
                                                value={formData.regon ?? ''}
                                                onChange={handleChange}
                                                placeholder="123456789"
                                                maxLength={14}
                                                className="form-control"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Logo URL
                                        </label>
                                        <input
                                            type="url"
                                            name="logoUrl"
                                            value={formData.logoUrl ?? ''}
                                            onChange={handleChange}
                                            placeholder="https://..."
                                            className="form-control"
                                        />
                                    </div>

                                    <div className="row g-4">
                                        <div>
                                            <label className="form-label">
                                                Kolor główny
                                            </label>
                                            <div className="d-d-flex gap-2">
                                                <input
                                                    type="color"
                                                    name="primaryColor"
                                                    value={
                                                        formData.primaryColor ??
                                                        '#25B4C1'
                                                    }
                                                    onChange={handleChange}
                                                    className="form-control form-control-color"
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
                                                    className="form-control flex-fill"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="form-label">
                                                Waluta
                                            </label>
                                            <select
                                                name="currency"
                                                value={
                                                    formData.currency ?? 'PLN'
                                                }
                                                onChange={handleChange}
                                                className="form-control"
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
                                            <label className="form-label">
                                                Strefa czasowa
                                            </label>
                                            <select
                                                name="timezone"
                                                value={
                                                    formData.timezone ??
                                                    'Europe/Warsaw'
                                                }
                                                onChange={handleChange}
                                                className="form-control"
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
                                <div className="">
                                    <div className="row g-4">
                                        <div className="col-12">
                                            <label className="form-label">
                                                Ulica
                                            </label>
                                            <input
                                                type="text"
                                                name="street"
                                                value={formData.street ?? ''}
                                                onChange={handleChange}
                                                className="form-control"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">
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
                                                className="form-control"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">
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
                                                className="form-control"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">
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
                                                className="form-control"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">
                                                Miasto
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city ?? ''}
                                                onChange={handleChange}
                                                className="form-control"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">
                                                Kraj
                                            </label>
                                            <input
                                                type="text"
                                                name="country"
                                                value={formData.country ?? ''}
                                                onChange={handleChange}
                                                className="form-control"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'contact' && (
                                <div className="">
                                    <div className="row g-4">
                                        <div>
                                            <label className="form-label">
                                                Telefon główny
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone ?? ''}
                                                onChange={handleChange}
                                                placeholder="+48 123 456 789"
                                                className="form-control"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">
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
                                                className="form-control"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email ?? ''}
                                                onChange={handleChange}
                                                className="form-control"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">
                                                Strona internetowa
                                            </label>
                                            <input
                                                type="url"
                                                name="website"
                                                value={formData.website ?? ''}
                                                onChange={handleChange}
                                                placeholder="https://..."
                                                className="form-control"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'social' && (
                                <div className="">
                                    <div>
                                        <label className="form-label">
                                            Facebook
                                        </label>
                                        <input
                                            type="url"
                                            name="facebookUrl"
                                            value={formData.facebookUrl ?? ''}
                                            onChange={handleChange}
                                            placeholder="https://facebook.com/..."
                                            className="form-control"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">
                                            Instagram
                                        </label>
                                        <input
                                            type="url"
                                            name="instagramUrl"
                                            value={formData.instagramUrl ?? ''}
                                            onChange={handleChange}
                                            placeholder="https://instagram.com/..."
                                            className="form-control"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">
                                            TikTok
                                        </label>
                                        <input
                                            type="url"
                                            name="tiktokUrl"
                                            value={formData.tiktokUrl ?? ''}
                                            onChange={handleChange}
                                            placeholder="https://tiktok.com/@..."
                                            className="form-control"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tax' && (
                                <div className="">
                                    <div className="d-d-flex align-align-items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="isVatPayer"
                                            name="isVatPayer"
                                            checked={
                                                formData.isVatPayer ?? true
                                            }
                                            onChange={handleChange}
                                            className="h-4 w-4 text-primary focus: border-secondary border-opacity-50 rounded"
                                        />
                                        <label
                                            htmlFor="isVatPayer"
                                            className="small text-body"
                                        >
                                            Firma jest płatnikiem VAT
                                        </label>
                                    </div>

                                    <div className="row g-4">
                                        <div>
                                            <label className="form-label">
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
                                                className="form-control"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">
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
                                                className="form-control"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Stopka paragonu
                                        </label>
                                        <textarea
                                            name="receiptFooter"
                                            value={formData.receiptFooter ?? ''}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="Dodatkowy tekst na paragonie..."
                                            className="form-control"
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Uwagi na fakturze
                                        </label>
                                        <textarea
                                            name="invoiceNotes"
                                            value={formData.invoiceNotes ?? ''}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="Domyślne uwagi na fakturach..."
                                            className="form-control"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'gdpr' && (
                                <div className="">
                                    <div className="bg-primary bg-opacity-10 border border-primary rounded-3 p-3">
                                        <h3 className="small fw-medium text-primary">
                                            Ochrona danych osobowych (RODO)
                                        </h3>
                                        <p className="small text-primary mt-1">
                                            Skonfiguruj ustawienia związane z
                                            przetwarzaniem danych osobowych
                                            klientów zgodnie z przepisami RODO.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="form-label">
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
                                            className="form-control"
                                        />
                                        <p className="small text-muted mt-1">
                                            Domyślnie 1095 dni (3 lata). Dane
                                            klientów będą automatycznie
                                            anonimizowane po tym okresie.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="form-label">
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
                                            className="form-control"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Save button */}
                        <div className="mt-3 d-flex justify-content-end gap-3">
                            {saved && (
                                <span className="d-flex align-items-center text-success small">
                                    <svg
                                        className="w-5 h-5 me-1"
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
                                className="px-4 py-2 bg-primary bg-opacity-10 text-white rounded-3 fw-medium bg-opacity-10 disabled: d-d-flex align-align-items-center gap-2"
                            >
                                {saving && (
                                    <div className="rounded-circle h-4 w-4 border-bottom-2 border-white"></div>
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
