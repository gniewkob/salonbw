'use client';

import { useState, useEffect, useRef } from 'react';
import type {
    Newsletter,
    CreateNewsletterRequest,
    RecipientFilter,
    NewsletterChannel,
} from '@/types';
import { useNewsletterMutations } from '@/hooks/useNewsletters';

interface Props {
    isOpen: boolean;
    newsletter: Newsletter | null;
    initialData?: {
        channel?: NewsletterChannel;
        recipientIds?: number[];
        filterMode?: 'filter' | 'manual';
        recipientFilter?: RecipientFilter;
    };
    onClose: () => void;
    onSave: (data: CreateNewsletterRequest) => Promise<void>;
}

const VARIABLES = [
    { key: '{{customer_name}}', label: 'Imię klienta' },
    { key: '{{customer_email}}', label: 'Email klienta' },
    { key: '{{salon_name}}', label: 'Nazwa salonu' },
    { key: '{{current_date}}', label: 'Aktualna data' },
    { key: '{{unsubscribe_link}}', label: 'Link wypisania' },
];

export default function NewsletterEditorModal({
    isOpen,
    newsletter,
    initialData,
    onClose,
    onSave,
}: Props) {
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [channel, setChannel] = useState<NewsletterChannel>('email');
    const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>({});
    const [recipientIds, setRecipientIds] = useState<number[]>([]);
    const [filterMode, setFilterMode] = useState<'filter' | 'manual'>('filter');
    const [saving, setSaving] = useState(false);
    const [previewCount, setPreviewCount] = useState<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { previewRecipients } = useNewsletterMutations();

    useEffect(() => {
        if (newsletter) {
            setName(newsletter.name);
            setSubject(newsletter.subject);
            setContent(newsletter.content);
            setChannel(newsletter.channel);
            setRecipientFilter(newsletter.recipientFilter ?? {});
            setRecipientIds(newsletter.recipientIds ?? []);
            setFilterMode(
                newsletter.recipientIds && newsletter.recipientIds.length > 0
                    ? 'manual'
                    : 'filter',
            );
        } else {
            setName('');
            setSubject('');
            setContent('');
            setChannel(initialData?.channel ?? 'email');
            setRecipientFilter(
                initialData?.recipientFilter ?? { hasEmailConsent: true },
            );
            setRecipientIds(initialData?.recipientIds ?? []);
            setFilterMode(initialData?.filterMode ?? 'filter');
        }
        setPreviewCount(null);
    }, [initialData, isOpen, newsletter]);

    const handlePreviewRecipients = async () => {
        try {
            const result = await previewRecipients.mutateAsync({
                recipientFilter:
                    filterMode === 'filter' ? recipientFilter : undefined,
                recipientIds:
                    filterMode === 'manual' ? recipientIds : undefined,
            });
            setPreviewCount(result.totalCount);
        } catch (error) {
            console.error('Failed to preview recipients:', error);
        }
    };

    const insertVariable = (variable: string) => {
        if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const newContent =
                content.substring(0, start) + variable + content.substring(end);
            setContent(newContent);
            // Set cursor position after the inserted variable
            setTimeout(() => {
                if (textareaRef.current) {
                    const newPos = start + variable.length;
                    textareaRef.current.setSelectionRange(newPos, newPos);
                    textareaRef.current.focus();
                }
            }, 0);
        } else {
            setContent(content + variable);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave({
                name,
                subject,
                content,
                channel,
                recipientFilter:
                    filterMode === 'filter' ? recipientFilter : undefined,
                recipientIds:
                    filterMode === 'manual' ? recipientIds : undefined,
            });
            onClose();
        } catch (error) {
            console.error('Failed to save newsletter:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    // Simple HTML preview - admin-only feature, content created by admin
    // Note: In production, sanitize with DOMPurify for additional safety
    const renderHtmlPreview = () => {
        if (channel !== 'email' || !content) return null;
        return (
            <div>
                <label className="d-block small fw-medium text-body mb-2">
                    Podgląd HTML
                </label>
                <div
                    className="bg-white border rounded-3 p-3 max-h-64 overflow-auto prose prose-sm"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            </div>
        );
    };

    return (
        <div className="position-fixed top-0 start-0 bottom-0 end-0 overflow-y-auto">
            <div className="d-flex min-h-100 align-items-center justify-content-center p-3">
                <div
                    className="position-fixed top-0 start-0 bottom-0 end-0 bg-dark/50"
                    onClick={onClose}
                    aria-hidden
                />
                <div className="position-relative bg-white rounded-4 shadow-lg w-100 max-w-4xl max-h-[90vh] overflow-d-none d-flex flex-column">
                    <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
                        <h2 className="fs-5 fw-semibold text-dark">
                            {newsletter
                                ? 'Edytuj newsletter'
                                : 'Nowy newsletter'}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-3"
                        >
                            <svg
                                className="w-5 h-5 text-muted"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <form
                        id="newsletter-form"
                        onSubmit={(event) => {
                            void handleSubmit(event);
                        }}
                        className="flex-fill overflow-y-auto p-4"
                    >
                        <div className="-cols-2 gap-4">
                            {/* Left column - Newsletter details */}
                            <div className="gap-2">
                                <div>
                                    <label
                                        htmlFor="nl-name"
                                        className="d-block small fw-medium text-body mb-1"
                                    >
                                        Nazwa (wewnętrzna)
                                    </label>
                                    <input
                                        id="nl-name"
                                        type="text"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        className="w-100 rounded-3 border-secondary border-opacity-50 shadow-sm focus:"
                                        placeholder="np. Newsletter Styczniowy 2026"
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="nl-subject"
                                        className="d-block small fw-medium text-body mb-1"
                                    >
                                        Temat wiadomości
                                    </label>
                                    <input
                                        id="nl-subject"
                                        type="text"
                                        value={subject}
                                        onChange={(e) =>
                                            setSubject(e.target.value)
                                        }
                                        className="w-100 rounded-3 border-secondary border-opacity-50 shadow-sm focus:"
                                        placeholder="np. Nowości w naszym salonie!"
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="nl-channel"
                                        className="d-block small fw-medium text-body mb-1"
                                    >
                                        Kanał
                                    </label>
                                    <select
                                        id="nl-channel"
                                        value={channel}
                                        onChange={(e) =>
                                            setChannel(
                                                e.target
                                                    .value as NewsletterChannel,
                                            )
                                        }
                                        className="w-100 rounded-3 border-secondary border-opacity-50 shadow-sm focus:"
                                    >
                                        <option value="email">Email</option>
                                        <option value="sms">SMS</option>
                                    </select>
                                </div>

                                {/* Variables */}
                                <div>
                                    <label className="d-block small fw-medium text-body mb-2">
                                        Zmienne
                                    </label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {VARIABLES.map((v) => (
                                            <button
                                                key={v.key}
                                                type="button"
                                                onClick={() =>
                                                    insertVariable(v.key)
                                                }
                                                className="px-2 py-1 small bg-light text-body rounded bg-opacity-25"
                                                title={v.label}
                                            >
                                                {v.key}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Content editor */}
                                <div>
                                    <label
                                        htmlFor="nl-content"
                                        className="d-block small fw-medium text-body mb-1"
                                    >
                                        Treść{' '}
                                        {channel === 'email'
                                            ? '(HTML)'
                                            : '(tekst)'}
                                    </label>
                                    <textarea
                                        id="nl-content"
                                        ref={textareaRef}
                                        value={content}
                                        onChange={(e) =>
                                            setContent(e.target.value)
                                        }
                                        rows={12}
                                        className="w-100 rounded-3 border-secondary border-opacity-50 shadow-sm focus: font-mono small"
                                        placeholder={
                                            channel === 'email'
                                                ? '<h1>Witaj {{customer_name}}!</h1>\n<p>Mamy dla Ciebie świetne nowości...</p>'
                                                : 'Witaj {{customer_name}}! Sprawdź nasze nowe usługi...'
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            {/* Right column - Recipients */}
                            <div className="gap-2">
                                <div>
                                    <label className="d-block small fw-medium text-body mb-2">
                                        Odbiorcy
                                    </label>
                                    <div className="d-flex gap-3 mb-3">
                                        <label className="d-flex align-items-center">
                                            <input
                                                type="radio"
                                                name="filterMode"
                                                value="filter"
                                                checked={
                                                    filterMode === 'filter'
                                                }
                                                onChange={() =>
                                                    setFilterMode('filter')
                                                }
                                                className="me-2"
                                            />
                                            Filtruj klientów
                                        </label>
                                        <label className="d-flex align-items-center">
                                            <input
                                                type="radio"
                                                name="filterMode"
                                                value="manual"
                                                checked={
                                                    filterMode === 'manual'
                                                }
                                                onChange={() =>
                                                    setFilterMode('manual')
                                                }
                                                className="me-2"
                                            />
                                            Wybierz ręcznie
                                        </label>
                                    </div>
                                </div>

                                {filterMode === 'filter' ? (
                                    <div className="bg-light rounded-3 p-3 gap-2">
                                        <div className="d-flex align-items-center gap-3">
                                            <label className="d-flex align-items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        recipientFilter.hasEmailConsent ??
                                                        false
                                                    }
                                                    onChange={(e) =>
                                                        setRecipientFilter({
                                                            ...recipientFilter,
                                                            hasEmailConsent:
                                                                e.target
                                                                    .checked ||
                                                                undefined,
                                                        })
                                                    }
                                                    className="me-2"
                                                />
                                                Tylko ze zgodą email
                                            </label>
                                            <label className="d-flex align-items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        recipientFilter.hasSmsConsent ??
                                                        false
                                                    }
                                                    onChange={(e) =>
                                                        setRecipientFilter({
                                                            ...recipientFilter,
                                                            hasSmsConsent:
                                                                e.target
                                                                    .checked ||
                                                                undefined,
                                                        })
                                                    }
                                                    className="me-2"
                                                />
                                                Tylko ze zgodą SMS
                                            </label>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="filter-gender"
                                                className="d-block small text-muted mb-1"
                                            >
                                                Płeć
                                            </label>
                                            <select
                                                id="filter-gender"
                                                value={
                                                    recipientFilter.gender ?? ''
                                                }
                                                onChange={(e) =>
                                                    setRecipientFilter({
                                                        ...recipientFilter,
                                                        gender: (e.target
                                                            .value ||
                                                            undefined) as
                                                            | 'male'
                                                            | 'female'
                                                            | 'other'
                                                            | undefined,
                                                    })
                                                }
                                                className="w-100 rounded-3 border-secondary border-opacity-50 shadow-sm small"
                                            >
                                                <option value="">
                                                    Wszystkie
                                                </option>
                                                <option value="female">
                                                    Kobiety
                                                </option>
                                                <option value="male">
                                                    Mężczyźni
                                                </option>
                                            </select>
                                        </div>

                                        <div className="-cols-2 gap-3">
                                            <div>
                                                <label
                                                    htmlFor="filter-age-min"
                                                    className="d-block small text-muted mb-1"
                                                >
                                                    Wiek min.
                                                </label>
                                                <input
                                                    id="filter-age-min"
                                                    type="number"
                                                    value={
                                                        recipientFilter.ageMin ??
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setRecipientFilter({
                                                            ...recipientFilter,
                                                            ageMin: e.target
                                                                .value
                                                                ? Number(
                                                                      e.target
                                                                          .value,
                                                                  )
                                                                : undefined,
                                                        })
                                                    }
                                                    className="w-100 rounded-3 border-secondary border-opacity-50 shadow-sm small"
                                                    min={0}
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    htmlFor="filter-age-max"
                                                    className="d-block small text-muted mb-1"
                                                >
                                                    Wiek max.
                                                </label>
                                                <input
                                                    id="filter-age-max"
                                                    type="number"
                                                    value={
                                                        recipientFilter.ageMax ??
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setRecipientFilter({
                                                            ...recipientFilter,
                                                            ageMax: e.target
                                                                .value
                                                                ? Number(
                                                                      e.target
                                                                          .value,
                                                                  )
                                                                : undefined,
                                                        })
                                                    }
                                                    className="w-100 rounded-3 border-secondary border-opacity-50 shadow-sm small"
                                                    min={0}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                void handlePreviewRecipients();
                                            }}
                                            className="w-100 px-3 py-2 small bg-white border border-secondary border-opacity-50 rounded-3"
                                        >
                                            Podgląd odbiorców
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-light rounded-3 p-3">
                                        <p className="small text-muted mb-2">
                                            Wprowadź ID klientów (oddzielone
                                            przecinkami):
                                        </p>
                                        <textarea
                                            value={recipientIds.join(', ')}
                                            onChange={(e) =>
                                                setRecipientIds(
                                                    e.target.value
                                                        .split(',')
                                                        .map((s) =>
                                                            parseInt(
                                                                s.trim(),
                                                                10,
                                                            ),
                                                        )
                                                        .filter(
                                                            (n) => !isNaN(n),
                                                        ),
                                                )
                                            }
                                            rows={4}
                                            className="w-100 rounded-3 border-secondary border-opacity-50 shadow-sm small"
                                            placeholder="np. 1, 5, 12, 34"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                void handlePreviewRecipients();
                                            }}
                                            className="w-100 mt-2 px-3 py-2 small bg-white border border-secondary border-opacity-50 rounded-3"
                                        >
                                            Podgląd odbiorców
                                        </button>
                                    </div>
                                )}

                                {previewCount !== null && (
                                    <div className="bg-primary bg-opacity-10 text-primary rounded-3 p-3 text-center">
                                        <span className="fs-3 fw-bold">
                                            {previewCount}
                                        </span>
                                        <p className="small">
                                            odbiorców spełnia kryteria
                                        </p>
                                    </div>
                                )}

                                {renderHtmlPreview()}
                            </div>
                        </div>
                    </form>

                    <div className="px-4 py-3 border-top bg-light d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-2 text-body bg-opacity-25 rounded-3"
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            form="newsletter-form"
                            disabled={saving || !name || !subject || !content}
                            className="px-4 py-2 bg-primary bg-opacity-10 text-white rounded-3 bg-opacity-10 disabled:"
                        >
                            {saving ? 'Zapisywanie...' : 'Zapisz'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
