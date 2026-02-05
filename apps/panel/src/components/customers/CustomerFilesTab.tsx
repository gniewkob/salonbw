'use client';

import { useState } from 'react';

interface Props {
    customerId: number;
}

type FileCategory = 'consent' | 'contract' | 'medical' | 'invoice' | 'other';

interface CustomerFile {
    id: number;
    name: string;
    url: string;
    size: number;
    mimeType: string;
    category: FileCategory;
    description?: string;
    createdAt: string;
    uploadedBy?: {
        id: number;
        name: string;
    };
}

const categoryConfig: Record<
    FileCategory,
    { label: string; icon: string; color: string }
> = {
    consent: {
        label: 'Zgoda',
        icon: '✍️',
        color: 'bg-green-100 text-green-700',
    },
    contract: {
        label: 'Umowa',
        icon: '📄',
        color: 'bg-blue-100 text-blue-700',
    },
    medical: {
        label: 'Dokumentacja medyczna',
        icon: '🏥',
        color: 'bg-purple-100 text-purple-700',
    },
    invoice: {
        label: 'Faktura',
        icon: '🧾',
        color: 'bg-yellow-100 text-yellow-700',
    },
    other: {
        label: 'Inne',
        icon: '📎',
        color: 'bg-gray-100 text-gray-700',
    },
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
export default function CustomerFilesTab({ customerId }: Props) {
    const [files] = useState<CustomerFile[]>([]);
    const [filterCategory, setFilterCategory] = useState<FileCategory | 'all'>(
        'all',
    );
    const isLoading = false;

    // TODO: Integrate with API when backend supports customer files
    // const { data: files, isLoading } = useCustomerFiles(customerId);
    // const uploadFile = useUploadCustomerFile();
    // const deleteFile = useDeleteCustomerFile();

    const handleUpload = () => {
        // TODO: Implement file upload
        alert('Funkcja dodawania plików będzie dostępna wkrótce');
    };

    const handleDownload = (file: CustomerFile) => {
        window.open(file.url, '_blank');
    };

    const handleDelete = (fileId: number) => {
        if (!confirm('Czy na pewno chcesz usunąć ten plik?')) return;
        // TODO: Implement delete
        console.log('Delete file:', fileId);
    };

    const filteredFiles =
        filterCategory === 'all'
            ? files
            : files.filter((f) => f.category === filterCategory);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Ładowanie plików...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                    Dokumenty klienta
                </h3>
                <button
                    onClick={handleUpload}
                    className="rounded bg-cyan-600 px-3 py-1.5 text-sm text-white hover:bg-cyan-700"
                >
                    + Dodaj plik
                </button>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setFilterCategory('all')}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                        filterCategory === 'all'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    Wszystkie
                </button>
                {Object.entries(categoryConfig).map(([key, config]) => (
                    <button
                        key={key}
                        onClick={() => setFilterCategory(key as FileCategory)}
                        className={`rounded-full px-3 py-1 text-sm transition-colors ${
                            filterCategory === key
                                ? 'bg-cyan-600 text-white'
                                : `${config.color} hover:opacity-80`
                        }`}
                    >
                        {config.icon} {config.label}
                    </button>
                ))}
            </div>

            {/* File List */}
            {filteredFiles.length > 0 ? (
                <div className="divide-y rounded-lg border bg-white">
                    {filteredFiles.map((file) => {
                        const config =
                            categoryConfig[file.category] ||
                            categoryConfig.other;
                        return (
                            <div
                                key={file.id}
                                className="flex items-center gap-4 p-4 hover:bg-gray-50"
                            >
                                {/* Icon */}
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color}`}
                                >
                                    <span className="text-lg">
                                        {config.icon}
                                    </span>
                                </div>

                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-800 truncate">
                                            {file.name}
                                        </span>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${config.color}`}
                                        >
                                            {config.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>{formatFileSize(file.size)}</span>
                                        <span>
                                            {new Date(
                                                file.createdAt,
                                            ).toLocaleDateString('pl-PL')}
                                        </span>
                                        {file.uploadedBy && (
                                            <span>
                                                Dodał: {file.uploadedBy.name}
                                            </span>
                                        )}
                                    </div>
                                    {file.description && (
                                        <p className="mt-1 text-sm text-gray-500 truncate">
                                            {file.description}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDownload(file)}
                                        className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-cyan-600"
                                        title="Pobierz"
                                    >
                                        ⬇️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(file.id)}
                                        className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                        title="Usuń"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-lg border bg-gray-50 p-8 text-center">
                    <div className="mb-2 text-4xl">📁</div>
                    <p className="text-gray-500">
                        {filterCategory === 'all'
                            ? 'Brak dokumentów klienta.'
                            : `Brak dokumentów w kategorii "${categoryConfig[filterCategory].label}".`}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                        Dodaj zgody, umowy lub inne dokumenty związane z
                        klientem.
                    </p>
                    <button
                        onClick={handleUpload}
                        className="mt-4 rounded bg-cyan-600 px-4 py-2 text-sm text-white hover:bg-cyan-700"
                    >
                        Dodaj pierwszy dokument
                    </button>
                </div>
            )}
        </div>
    );
}
