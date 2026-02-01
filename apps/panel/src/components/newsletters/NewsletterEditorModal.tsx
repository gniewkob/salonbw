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
    onClose: () => void;
    onSave: (data: CreateNewsletterRequest) => Promise<void>;
}

const VARIABLES = [
    { key: '{{client_name}}', label: 'Imię klienta' },
    { key: '{{client_email}}', label: 'Email klienta' },
    { key: '{{salon_name}}', label: 'Nazwa salonu' },
    { key: '{{current_date}}', label: 'Aktualna data' },
    { key: '{{unsubscribe_link}}', label: 'Link wypisania' },
];

export default function NewsletterEditorModal({
    isOpen,
    newsletter,
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
            setChannel('email');
            setRecipientFilter({ hasEmailConsent: true });
            setRecipientIds([]);
            setFilterMode('filter');
        }
        setPreviewCount(null);
    }, [newsletter, isOpen]);

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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Podgląd HTML
                </label>
                <div
                    className="bg-white border rounded-lg p-4 max-h-64 overflow-auto prose prose-sm"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="fixed inset-0 bg-black/50"
                    onClick={onClose}
                    aria-hidden
                />
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {newsletter
                                ? 'Edytuj newsletter'
                                : 'Nowy newsletter'}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg
                                className="w-5 h-5 text-gray-500"
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
                        className="flex-1 overflow-y-auto p-6"
                    >
                        <div className="grid grid-cols-2 gap-6">
                            {/* Left column - Newsletter details */}
                            <div className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="nl-name"
                                        className="block text-sm font-medium text-gray-700 mb-1"
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
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        placeholder="np. Newsletter Styczniowy 2026"
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="nl-subject"
                                        className="block text-sm font-medium text-gray-700 mb-1"
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
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        placeholder="np. Nowości w naszym salonie!"
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="nl-channel"
                                        className="block text-sm font-medium text-gray-700 mb-1"
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
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    >
                                        <option value="email">Email</option>
                                        <option value="sms">SMS</option>
                                    </select>
                                </div>

                                {/* Variables */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Zmienne
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {VARIABLES.map((v) => (
                                            <button
                                                key={v.key}
                                                type="button"
                                                onClick={() =>
                                                    insertVariable(v.key)
                                                }
                                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
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
                                        className="block text-sm font-medium text-gray-700 mb-1"
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
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-mono text-sm"
                                        placeholder={
                                            channel === 'email'
                                                ? '<h1>Witaj {{client_name}}!</h1>\n<p>Mamy dla Ciebie świetne nowości...</p>'
                                                : 'Witaj {{client_name}}! Sprawdź nasze nowe usługi...'
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            {/* Right column - Recipients */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Odbiorcy
                                    </label>
                                    <div className="flex gap-4 mb-4">
                                        <label className="flex items-center">
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
                                                className="mr-2"
                                            />
                                            Filtruj klientów
                                        </label>
                                        <label className="flex items-center">
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
                                                className="mr-2"
                                            />
                                            Wybierz ręcznie
                                        </label>
                                    </div>
                                </div>

                                {filterMode === 'filter' ? (
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center">
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
                                                    className="mr-2"
                                                />
                                                Tylko ze zgodą email
                                            </label>
                                            <label className="flex items-center">
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
                                                    className="mr-2"
                                                />
                                                Tylko ze zgodą SMS
                                            </label>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="filter-gender"
                                                className="block text-sm text-gray-600 mb-1"
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
                                                className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
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

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label
                                                    htmlFor="filter-age-min"
                                                    className="block text-sm text-gray-600 mb-1"
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
                                                    className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                                                    min={0}
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    htmlFor="filter-age-max"
                                                    className="block text-sm text-gray-600 mb-1"
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
                                                    className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                                                    min={0}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                void handlePreviewRecipients();
                                            }}
                                            className="w-full px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Podgląd odbiorców
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-2">
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
                                            className="w-full rounded-lg border-gray-300 shadow-sm text-sm"
                                            placeholder="np. 1, 5, 12, 34"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                void handlePreviewRecipients();
                                            }}
                                            className="w-full mt-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Podgląd odbiorców
                                        </button>
                                    </div>
                                )}

                                {previewCount !== null && (
                                    <div className="bg-primary-50 text-primary-700 rounded-lg p-4 text-center">
                                        <span className="text-2xl font-bold">
                                            {previewCount}
                                        </span>
                                        <p className="text-sm">
                                            odbiorców spełnia kryteria
                                        </p>
                                    </div>
                                )}

                                {renderHtmlPreview()}
                            </div>
                        </div>
                    </form>

                    <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            form="newsletter-form"
                            disabled={saving || !name || !subject || !content}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Zapisywanie...' : 'Zapisz'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
