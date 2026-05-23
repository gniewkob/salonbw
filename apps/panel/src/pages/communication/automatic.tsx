'use client';

import { useState } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useAutomaticMessages } from '@/hooks/useAutomaticMessages';
import { useMessageTemplates } from '@/hooks/useSms';
import type {
    AutomaticMessageRule,
    AutomaticMessageTrigger,
    AutomaticMessageChannel,
    CreateAutomaticMessageRuleRequest,
} from '@/types';

const TRIGGER_LABELS: Record<AutomaticMessageTrigger, string> = {
    appointment_reminder: 'Przypomnienie przed wizytą',
    appointment_confirmation: 'Potwierdzenie rezerwacji',
    appointment_cancellation: 'Anulowanie wizyty',
    follow_up: 'Wiadomość po wizycie',
    birthday: 'Urodziny klienta',
    inactive_client: 'Nieaktywny klient',
    new_client: 'Nowy klient',
    review_request: 'Prośba o opinię',
};

const CHANNEL_LABELS: Record<AutomaticMessageChannel, string> = {
    sms: 'SMS',
    email: 'Email',
    whatsapp: 'WhatsApp',
};

const TRIGGERS_WITH_OFFSET: AutomaticMessageTrigger[] = [
    'appointment_reminder',
    'appointment_confirmation',
    'appointment_cancellation',
    'follow_up',
    'review_request',
];

const DEFAULT_FORM: CreateAutomaticMessageRuleRequest = {
    name: '',
    description: '',
    trigger: 'appointment_reminder',
    channel: 'sms',
    offsetHours: 24,
    sendWindowStart: '09:00',
    sendWindowEnd: '20:00',
    isActive: true,
};

export default function AutomaticMessagesPage() {
    const { role } = useAuth();
    const { rules, loading, createRule, updateRule, toggleRule, deleteRule } =
        useAutomaticMessages();
    const { data: templates } = useMessageTemplates();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AutomaticMessageRule | null>(
        null,
    );
    const [form, setForm] =
        useState<CreateAutomaticMessageRuleRequest>(DEFAULT_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const openAdd = () => {
        setEditingRule(null);
        setForm(DEFAULT_FORM);
        setIsModalOpen(true);
    };

    const openEdit = (rule: AutomaticMessageRule) => {
        setEditingRule(rule);
        setForm({
            name: rule.name,
            description: rule.description ?? '',
            trigger: rule.trigger,
            channel: rule.channel,
            offsetHours: rule.offsetHours,
            inactivityDays: rule.inactivityDays ?? undefined,
            sendWindowStart: rule.sendWindowStart,
            sendWindowEnd: rule.sendWindowEnd,
            templateId: rule.templateId ?? undefined,
            content: rule.content ?? '',
            isActive: rule.isActive,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setIsSaving(true);
        try {
            if (editingRule) {
                await updateRule(editingRule.id, form);
            } else {
                await createRule(form);
            }
            setIsModalOpen(false);
        } catch {
            alert('Nie udało się zapisać reguły. Spróbuj ponownie.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggle = async (id: number) => {
        try {
            await toggleRule(id);
        } catch {
            alert('Nie udało się zmienić statusu reguły.');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteRule(id);
            setConfirmDeleteId(null);
        } catch {
            alert('Nie udało się usunąć reguły.');
        }
    };

    const showOffset = TRIGGERS_WITH_OFFSET.includes(
        form.trigger as AutomaticMessageTrigger,
    );

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:communication">
            <SalonShell role={role}>
                <div className="salonbw-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_communication"
                        items={[
                            { label: 'Łączność', href: '/communication' },
                            { label: 'Automatyczne wiadomości' },
                        ]}
                    />

                    <div className="salonbw-page__toolbar">
                        <Link
                            href="/communication"
                            className="salonbw-btn salonbw-btn--light"
                        >
                            ← Powrót
                        </Link>
                        <button
                            type="button"
                            className="salonbw-btn salonbw-btn--primary"
                            onClick={openAdd}
                        >
                            + Nowa reguła
                        </button>
                    </div>

                    <div className="salonbw-page__description mb-3">
                        <p className="text-muted">
                            Reguły automatycznych wiadomości wysyłanych do
                            klientów przy określonych zdarzeniach (rezerwacja,
                            wizyta, urodziny).
                        </p>
                    </div>

                    {loading ? (
                        <div className="salonbw-loading">Ładowanie reguł…</div>
                    ) : rules.length === 0 ? (
                        <div className="salonbw-empty">
                            <p>Brak zdefiniowanych reguł automatycznych.</p>
                            <button
                                type="button"
                                className="salonbw-btn salonbw-btn--primary mt-2"
                                onClick={openAdd}
                            >
                                Utwórz pierwszą regułę
                            </button>
                        </div>
                    ) : (
                        <div className="list-table-responsive">
                            <table className="list-table">
                                <thead>
                                    <tr>
                                        <th>Nazwa</th>
                                        <th>Wyzwalacz</th>
                                        <th>Kanał</th>
                                        <th>Offset</th>
                                        <th>Wysłanych</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rules.map((rule) => (
                                        <tr key={rule.id}>
                                            <td>
                                                <strong>{rule.name}</strong>
                                                {rule.description && (
                                                    <div className="text-muted small">
                                                        {rule.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {TRIGGER_LABELS[rule.trigger] ??
                                                    rule.trigger}
                                            </td>
                                            <td>
                                                <span className="badge bg-secondary">
                                                    {CHANNEL_LABELS[
                                                        rule.channel
                                                    ] ?? rule.channel}
                                                </span>
                                            </td>
                                            <td>
                                                {TRIGGERS_WITH_OFFSET.includes(
                                                    rule.trigger,
                                                )
                                                    ? `${rule.offsetHours}h`
                                                    : '—'}
                                            </td>
                                            <td>{rule.sentCount}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className={`badge border-0 ${rule.isActive ? 'bg-success' : 'bg-secondary'}`}
                                                    onClick={() =>
                                                        void handleToggle(
                                                            rule.id,
                                                        )
                                                    }
                                                    title={
                                                        rule.isActive
                                                            ? 'Kliknij aby wyłączyć'
                                                            : 'Kliknij aby włączyć'
                                                    }
                                                >
                                                    {rule.isActive
                                                        ? 'Aktywna'
                                                        : 'Nieaktywna'}
                                                </button>
                                            </td>
                                            <td className="text-end">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-secondary me-1"
                                                    onClick={() =>
                                                        openEdit(rule)
                                                    }
                                                >
                                                    Edytuj
                                                </button>
                                                {confirmDeleteId === rule.id ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-danger me-1"
                                                            onClick={() =>
                                                                void handleDelete(
                                                                    rule.id,
                                                                )
                                                            }
                                                        >
                                                            Potwierdź
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() =>
                                                                setConfirmDeleteId(
                                                                    null,
                                                                )
                                                            }
                                                        >
                                                            Anuluj
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() =>
                                                            setConfirmDeleteId(
                                                                rule.id,
                                                            )
                                                        }
                                                    >
                                                        Usuń
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {isModalOpen && (
                    <div className="salonbw-modal-overlay">
                        <div
                            className="salonbw-modal"
                            role="dialog"
                            aria-modal="true"
                        >
                            <div className="salonbw-modal__header">
                                <h3>
                                    {editingRule
                                        ? 'Edytuj regułę'
                                        : 'Nowa reguła automatyczna'}
                                </h3>
                                <button
                                    type="button"
                                    className="salonbw-modal__close"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={(e) => void handleSubmit(e)}>
                                <div className="salonbw-modal__body">
                                    <div className="salonbw-form-group">
                                        <label htmlFor="rule-name">
                                            Nazwa reguły{' '}
                                            <span className="text-danger">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            id="rule-name"
                                            className="form-control"
                                            value={form.name}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    name: e.target.value,
                                                }))
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="salonbw-form-group">
                                        <label htmlFor="rule-trigger">
                                            Wyzwalacz
                                        </label>
                                        <select
                                            id="rule-trigger"
                                            className="form-select"
                                            value={form.trigger}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    trigger: e.target
                                                        .value as AutomaticMessageTrigger,
                                                }))
                                            }
                                        >
                                            {Object.entries(TRIGGER_LABELS).map(
                                                ([value, label]) => (
                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {label}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>

                                    <div className="row g-2">
                                        <div className="col-6">
                                            <div className="salonbw-form-group">
                                                <label htmlFor="rule-channel">
                                                    Kanał
                                                </label>
                                                <select
                                                    id="rule-channel"
                                                    className="form-select"
                                                    value={form.channel}
                                                    onChange={(e) =>
                                                        setForm((f) => ({
                                                            ...f,
                                                            channel: e.target
                                                                .value as AutomaticMessageChannel,
                                                        }))
                                                    }
                                                >
                                                    {Object.entries(
                                                        CHANNEL_LABELS,
                                                    ).map(([value, label]) => (
                                                        <option
                                                            key={value}
                                                            value={value}
                                                        >
                                                            {label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        {showOffset && (
                                            <div className="col-6">
                                                <div className="salonbw-form-group">
                                                    <label htmlFor="rule-offset">
                                                        Czas (h)
                                                    </label>
                                                    <input
                                                        id="rule-offset"
                                                        type="number"
                                                        className="form-control"
                                                        value={
                                                            form.offsetHours ??
                                                            24
                                                        }
                                                        min={0}
                                                        max={720}
                                                        onChange={(e) =>
                                                            setForm((f) => ({
                                                                ...f,
                                                                offsetHours:
                                                                    parseInt(
                                                                        e.target
                                                                            .value,
                                                                        10,
                                                                    ) || 0,
                                                            }))
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="row g-2">
                                        <div className="col-6">
                                            <div className="salonbw-form-group">
                                                <label htmlFor="rule-window-start">
                                                    Okno od
                                                </label>
                                                <input
                                                    id="rule-window-start"
                                                    type="time"
                                                    className="form-control"
                                                    value={
                                                        form.sendWindowStart ??
                                                        '09:00'
                                                    }
                                                    onChange={(e) =>
                                                        setForm((f) => ({
                                                            ...f,
                                                            sendWindowStart:
                                                                e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="salonbw-form-group">
                                                <label htmlFor="rule-window-end">
                                                    Okno do
                                                </label>
                                                <input
                                                    id="rule-window-end"
                                                    type="time"
                                                    className="form-control"
                                                    value={
                                                        form.sendWindowEnd ??
                                                        '20:00'
                                                    }
                                                    onChange={(e) =>
                                                        setForm((f) => ({
                                                            ...f,
                                                            sendWindowEnd:
                                                                e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="salonbw-form-group">
                                        <label htmlFor="rule-template">
                                            Szablon wiadomości
                                        </label>
                                        <select
                                            id="rule-template"
                                            className="form-select"
                                            value={form.templateId ?? ''}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    templateId: e.target.value
                                                        ? Number(e.target.value)
                                                        : undefined,
                                                    content: '',
                                                }))
                                            }
                                        >
                                            <option value="">
                                                — bez szablonu —
                                            </option>
                                            {templates
                                                .filter(
                                                    (t) =>
                                                        t.channel ===
                                                        form.channel,
                                                )
                                                .map((t) => (
                                                    <option
                                                        key={t.id}
                                                        value={t.id}
                                                    >
                                                        {t.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    {!form.templateId && (
                                        <div className="salonbw-form-group">
                                            <label htmlFor="rule-content">
                                                Treść wiadomości
                                            </label>
                                            <textarea
                                                id="rule-content"
                                                className="form-control"
                                                rows={4}
                                                value={form.content ?? ''}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        content: e.target.value,
                                                    }))
                                                }
                                                placeholder="Dostępne zmienne: {clientName}, {serviceName}, {date}, {time}, {employeeName}"
                                            />
                                        </div>
                                    )}

                                    <div className="form-check">
                                        <input
                                            id="rule-active"
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={form.isActive ?? true}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    isActive: e.target.checked,
                                                }))
                                            }
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor="rule-active"
                                        >
                                            Reguła aktywna
                                        </label>
                                    </div>
                                </div>

                                <div className="salonbw-modal__footer">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary ms-2"
                                        disabled={isSaving || !form.name.trim()}
                                    >
                                        {isSaving ? 'Zapisywanie…' : 'Zapisz'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </SalonShell>
        </RouteGuard>
    );
}
