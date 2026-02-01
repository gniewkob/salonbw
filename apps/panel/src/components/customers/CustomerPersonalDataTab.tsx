'use client';

import { useState } from 'react';
import { Customer } from '@/types';

interface Props {
    customer: Customer;
    onUpdate?: (data: Partial<Customer>) => Promise<void> | void;
}

export default function CustomerPersonalDataTab({ customer, onUpdate }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Customer>>({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        phone: customer.phone || '',
        email: customer.email || '',
        birthDate: customer.birthDate || '',
        gender: customer.gender,
        address: customer.address || '',
        city: customer.city || '',
        postalCode: customer.postalCode || '',
        description: customer.description || '',
    });

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (onUpdate) {
            void onUpdate(formData);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData({
            firstName: customer.firstName || '',
            lastName: customer.lastName || '',
            phone: customer.phone || '',
            email: customer.email || '',
            birthDate: customer.birthDate || '',
            gender: customer.gender,
            address: customer.address || '',
            city: customer.city || '',
            postalCode: customer.postalCode || '',
            description: customer.description || '',
        });
        setIsEditing(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                    Dane osobowe
                </h3>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="rounded bg-cyan-600 px-3 py-1.5 text-sm text-white hover:bg-cyan-700"
                    >
                        Edytuj
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleCancel}
                            className="rounded border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                        >
                            Anuluj
                        </button>
                        <button
                            onClick={handleSave}
                            className="rounded bg-cyan-600 px-3 py-1.5 text-sm text-white hover:bg-cyan-700"
                        >
                            Zapisz
                        </button>
                    </div>
                )}
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* First Name */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Imię
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full rounded border px-3 py-2"
                            />
                        ) : (
                            <p className="py-2 text-gray-900">
                                {customer.firstName || '-'}
                            </p>
                        )}
                    </div>

                    {/* Last Name */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Nazwisko
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full rounded border px-3 py-2"
                            />
                        ) : (
                            <p className="py-2 text-gray-900">
                                {customer.lastName || '-'}
                            </p>
                        )}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Telefon
                        </label>
                        {isEditing ? (
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone || ''}
                                onChange={handleChange}
                                className="w-full rounded border px-3 py-2"
                            />
                        ) : (
                            <p className="py-2 text-gray-900">
                                {customer.phone || '-'}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            E-mail
                        </label>
                        {isEditing ? (
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full rounded border px-3 py-2"
                            />
                        ) : (
                            <p className="py-2 text-gray-900">
                                {customer.email || '-'}
                            </p>
                        )}
                    </div>

                    {/* Birth Date */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Data urodzenia
                        </label>
                        {isEditing ? (
                            <input
                                type="date"
                                name="birthDate"
                                value={formData.birthDate || ''}
                                onChange={handleChange}
                                className="w-full rounded border px-3 py-2"
                            />
                        ) : (
                            <p className="py-2 text-gray-900">
                                {customer.birthDate
                                    ? new Date(
                                          customer.birthDate,
                                      ).toLocaleDateString('pl-PL')
                                    : '-'}
                            </p>
                        )}
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Płeć
                        </label>
                        {isEditing ? (
                            <select
                                name="gender"
                                value={formData.gender || ''}
                                onChange={handleChange}
                                className="w-full rounded border px-3 py-2"
                            >
                                <option value="">Nie podano</option>
                                <option value="female">Kobieta</option>
                                <option value="male">Mężczyzna</option>
                                <option value="other">Inna</option>
                            </select>
                        ) : (
                            <p className="py-2 text-gray-900">
                                {customer.gender === 'female'
                                    ? 'Kobieta'
                                    : customer.gender === 'male'
                                      ? 'Mężczyzna'
                                      : customer.gender === 'other'
                                        ? 'Inna'
                                        : '-'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Address Section */}
                <div className="mt-6 border-t pt-6">
                    <h4 className="mb-4 text-sm font-semibold text-gray-700">
                        Adres
                    </h4>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Ulica i numer
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full rounded border px-3 py-2"
                                />
                            ) : (
                                <p className="py-2 text-gray-900">
                                    {customer.address || '-'}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Kod pocztowy
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="postalCode"
                                    value={formData.postalCode}
                                    onChange={handleChange}
                                    className="w-full rounded border px-3 py-2"
                                />
                            ) : (
                                <p className="py-2 text-gray-900">
                                    {customer.postalCode || '-'}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Miasto
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full rounded border px-3 py-2"
                                />
                            ) : (
                                <p className="py-2 text-gray-900">
                                    {customer.city || '-'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="mt-6 border-t pt-6">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Opis
                    </label>
                    {isEditing ? (
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full rounded border px-3 py-2"
                            placeholder="Dodatkowe informacje o kliencie..."
                        />
                    ) : (
                        <p className="py-2 text-gray-900">
                            {customer.description || '-'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
