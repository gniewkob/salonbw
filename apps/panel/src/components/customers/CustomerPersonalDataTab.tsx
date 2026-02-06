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
        <div className="row">
            <div className="col-sm-12">
                <div className="versum-widget">
                    <div className="versum-widget__header flex-between">
                        <span>Dane osobowe</span>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="btn btn-default btn-xs"
                            >
                                <i className="icon-edit"></i> Edytuj
                            </button>
                        ) : (
                            <div className="btn-group">
                                <button
                                    onClick={handleCancel}
                                    className="btn btn-default btn-xs"
                                >
                                    Anuluj
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="btn btn-primary btn-xs"
                                >
                                    Zapisz
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="versum-widget__content form-horizontal">
                        {/* First Name */}
                        <div className="form-group">
                            <label className="control-label">Imię</label>
                            <div className="control-content">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="form-control"
                                    />
                                ) : (
                                    <span>{customer.firstName || '-'}</span>
                                )}
                            </div>
                        </div>

                        {/* Last Name */}
                        <div className="form-group">
                            <label className="control-label">Nazwisko</label>
                            <div className="control-content">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="form-control"
                                    />
                                ) : (
                                    <span>{customer.lastName || '-'}</span>
                                )}
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="form-group">
                            <label className="control-label">Telefon</label>
                            <div className="control-content">
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone || ''}
                                        onChange={handleChange}
                                        className="form-control"
                                    />
                                ) : (
                                    <span>{customer.phone || '-'}</span>
                                )}
                            </div>
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label className="control-label">E-mail</label>
                            <div className="control-content">
                                {isEditing ? (
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="form-control"
                                    />
                                ) : (
                                    <span>{customer.email || '-'}</span>
                                )}
                            </div>
                        </div>

                        {/* Birth Date */}
                        <div className="form-group">
                            <label className="control-label">
                                Data urodzenia
                            </label>
                            <div className="control-content">
                                {isEditing ? (
                                    <input
                                        type="date"
                                        name="birthDate"
                                        value={formData.birthDate || ''}
                                        onChange={handleChange}
                                        className="form-control"
                                    />
                                ) : (
                                    <span>
                                        {customer.birthDate
                                            ? new Date(
                                                  customer.birthDate,
                                              ).toLocaleDateString('pl-PL')
                                            : '-'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Gender */}
                        <div className="form-group">
                            <label className="control-label">Płeć</label>
                            <div className="control-content">
                                {isEditing ? (
                                    <select
                                        name="gender"
                                        value={formData.gender || ''}
                                        onChange={handleChange}
                                        className="form-control"
                                    >
                                        <option value="">Nie podano</option>
                                        <option value="female">Kobieta</option>
                                        <option value="male">Mężczyzna</option>
                                        <option value="other">Inna</option>
                                    </select>
                                ) : (
                                    <span>
                                        {customer.gender === 'female'
                                            ? 'Kobieta'
                                            : customer.gender === 'male'
                                              ? 'Mężczyzna'
                                              : customer.gender === 'other'
                                                ? 'Inna'
                                                : '-'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Address */}
                        <div
                            className="form-group"
                            style={{ marginTop: '20px' }}
                        >
                            <label className="control-label">Adres</label>
                            <div className="control-content">
                                {isEditing ? (
                                    <div className="row" style={{ margin: 0 }}>
                                        <div
                                            className="col-sm-6"
                                            style={{ paddingLeft: 0 }}
                                        >
                                            <input
                                                type="text"
                                                name="address"
                                                placeholder="Ulica i numer"
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="form-control"
                                            />
                                        </div>
                                        <div className="col-sm-3">
                                            <input
                                                type="text"
                                                name="postalCode"
                                                placeholder="Kod"
                                                value={formData.postalCode}
                                                onChange={handleChange}
                                                className="form-control"
                                            />
                                        </div>
                                        <div
                                            className="col-sm-3"
                                            style={{ paddingRight: 0 }}
                                        >
                                            <input
                                                type="text"
                                                name="city"
                                                placeholder="Miasto"
                                                value={formData.city}
                                                onChange={handleChange}
                                                className="form-control"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <span>
                                        {[
                                            customer.address,
                                            customer.postalCode,
                                            customer.city,
                                        ]
                                            .filter(Boolean)
                                            .join(', ') || '-'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label className="control-label">
                                Opis (notatka)
                            </label>
                            <div className="control-content">
                                {isEditing ? (
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                        className="form-control"
                                        placeholder="Dodatkowe informacje..."
                                    />
                                ) : (
                                    <span>{customer.description || '-'}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
