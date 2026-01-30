'use client';

import type { MessageTemplate, TemplateType } from '@/types';

interface Props {
    templates: MessageTemplate[];
    onEdit?: (template: MessageTemplate) => void;
    onDelete?: (id: number) => void;
    onSetDefault?: (id: number) => void;
}

const TYPE_LABELS: Record<TemplateType, string> = {
    appointment_reminder: 'Przypomnienie',
    appointment_confirmation: 'Potwierdzenie',
    appointment_cancellation: 'Anulowanie',
    birthday_wish: 'Urodziny',
    follow_up: 'Follow-up',
    marketing: 'Marketing',
    custom: 'Własny',
};

const TYPE_COLORS: Record<TemplateType, string> = {
    appointment_reminder: 'bg-blue-100 text-blue-700',
    appointment_confirmation: 'bg-green-100 text-green-700',
    appointment_cancellation: 'bg-red-100 text-red-700',
    birthday_wish: 'bg-pink-100 text-pink-700',
    follow_up: 'bg-purple-100 text-purple-700',
    marketing: 'bg-yellow-100 text-yellow-700',
    custom: 'bg-gray-100 text-gray-700',
};

export default function TemplatesList({
    templates,
    onEdit,
    onDelete,
    onSetDefault,
}: Props) {
    if (templates.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                Brak szablonów wiadomości
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {templates.map((template) => (
                <div
                    key={template.id}
                    className={`bg-white border rounded-lg p-4 ${
                        !template.isActive ? 'opacity-60' : ''
                    }`}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[template.type]}`}
                                >
                                    {TYPE_LABELS[template.type]}
                                </span>
                                <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 uppercase">
                                    {template.channel}
                                </span>
                                {template.isDefault && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-primary-100 text-primary-700">
                                        Domyślny
                                    </span>
                                )}
                                {!template.isActive && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-500">
                                        Nieaktywny
                                    </span>
                                )}
                            </div>
                            <h4 className="font-medium text-gray-800">{template.name}</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {template.content}
                            </p>
                            {template.availableVariables && template.availableVariables.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {template.availableVariables.map((v) => (
                                        <code
                                            key={v}
                                            className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                                        >
                                            {`{{${v}}}`}
                                        </code>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                            {!template.isDefault && onSetDefault && (
                                <button
                                    type="button"
                                    onClick={() => onSetDefault(template.id)}
                                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                    title="Ustaw jako domyślny"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                        />
                                    </svg>
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    type="button"
                                    onClick={() => onEdit(template)}
                                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                    title="Edytuj"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                        />
                                    </svg>
                                </button>
                            )}
                            {onDelete && !template.isDefault && (
                                <button
                                    type="button"
                                    onClick={() => onDelete(template.id)}
                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                    title="Usuń"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
