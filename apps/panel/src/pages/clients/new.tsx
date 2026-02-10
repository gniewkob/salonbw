'use client';

import { useRouter } from 'next/router';
import Link from 'next/link';
import type { Route } from 'next';
import { useState, type FormEvent } from 'react';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateCustomer } from '@/hooks/useCustomers';

type Draft = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
};

export default function NewCustomerPage() {
    const router = useRouter();
    const { role } = useAuth();
    const create = useCreateCustomer();

    const [form, setForm] = useState<Draft>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });

    if (!role) return null;

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const created = await create.mutateAsync({
            firstName: form.firstName.trim() || undefined,
            lastName: form.lastName.trim() || undefined,
            email: form.email.trim() || undefined,
            phone: form.phone.trim() || undefined,
        });
        void router.push(`/clients/${created.id}` as Route);
    };

    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:clients"
        >
            <VersumShell role={role}>
                <div className="clients-page">
                    <ul className="breadcrumb">
                        <li>Klienci / Dodaj klienta</li>
                    </ul>

                    <div className="versum-widget">
                        <div className="versum-widget__header flex-between">
                            <span>Nowy klient</span>
                            <Link
                                href={'/clients' as Route}
                                className="btn btn-default btn-xs"
                            >
                                Wróć do listy
                            </Link>
                        </div>

                        <div className="versum-widget__content">
                            <form onSubmit={(e) => void onSubmit(e)}>
                                <div className="row">
                                    <div className="col-sm-6">
                                        <div className="form-group">
                                            <label
                                                className="control-label"
                                                htmlFor="firstName"
                                            >
                                                Imię
                                            </label>
                                            <input
                                                id="firstName"
                                                className="form-control"
                                                value={form.firstName}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        firstName:
                                                            e.target.value,
                                                    }))
                                                }
                                                autoFocus
                                                disabled={create.isPending}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-sm-6">
                                        <div className="form-group">
                                            <label
                                                className="control-label"
                                                htmlFor="lastName"
                                            >
                                                Nazwisko
                                            </label>
                                            <input
                                                id="lastName"
                                                className="form-control"
                                                value={form.lastName}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        lastName:
                                                            e.target.value,
                                                    }))
                                                }
                                                disabled={create.isPending}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-sm-6">
                                        <div className="form-group">
                                            <label
                                                className="control-label"
                                                htmlFor="phone"
                                            >
                                                Telefon
                                            </label>
                                            <input
                                                id="phone"
                                                className="form-control"
                                                value={form.phone}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        phone: e.target.value,
                                                    }))
                                                }
                                                disabled={create.isPending}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-sm-6">
                                        <div className="form-group">
                                            <label
                                                className="control-label"
                                                htmlFor="email"
                                            >
                                                Email
                                            </label>
                                            <input
                                                id="email"
                                                className="form-control"
                                                value={form.email}
                                                onChange={(e) =>
                                                    setForm((p) => ({
                                                        ...p,
                                                        email: e.target.value,
                                                    }))
                                                }
                                                disabled={create.isPending}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <Link
                                        href={'/clients' as Route}
                                        className="btn btn-default"
                                    >
                                        Anuluj
                                    </Link>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={
                                            create.isPending ||
                                            (!form.firstName.trim() &&
                                                !form.lastName.trim() &&
                                                !form.email.trim() &&
                                                !form.phone.trim())
                                        }
                                    >
                                        {create.isPending
                                            ? 'Zapisywanie...'
                                            : 'Utwórz klienta'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </VersumShell>
        </RouteGuard>
    );
}
