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
        <div className="row">
            <div className="col-sm-12">
                <div className="versum-widget">
                    <div className="versum-widget__header flex-between">
                        <span>Dokumenty klienta</span>
                        <button
                            onClick={handleUpload}
                            className="btn btn-primary btn-xs"
                        >
                            + Dodaj plik
                        </button>
                    </div>

                    <div className="versum-widget__content">
                        {/* Category Filter */}
                        <div
                            style={{
                                marginBottom: '20px',
                                borderBottom: '1px solid #eee',
                                paddingBottom: '10px',
                            }}
                        >
                            <div className="btn-group">
                                <button
                                    onClick={() => setFilterCategory('all')}
                                    className={`btn btn-xs ${filterCategory === 'all' ? 'btn-primary' : 'btn-default'}`}
                                >
                                    Wszystkie
                                </button>
                                {Object.entries(categoryConfig).map(
                                    ([key, config]) => (
                                        <button
                                            key={key}
                                            onClick={() =>
                                                setFilterCategory(
                                                    key as FileCategory,
                                                )
                                            }
                                            className={`btn btn-xs ${filterCategory === key ? 'btn-primary' : 'btn-default'}`}
                                        >
                                            {config.label}
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>

                        {/* File Table */}
                        {filteredFiles.length > 0 ? (
                            <table
                                className="versum-table"
                                style={{ fontSize: '13px' }}
                            >
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}></th>
                                        <th>Nazwa pliku</th>
                                        <th>Kategoria</th>
                                        <th>Rozmiar</th>
                                        <th>Data dodania</th>
                                        <th style={{ width: '80px' }}>Opcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFiles.map((file) => (
                                        <tr key={file.id}>
                                            <td
                                                className="text-center"
                                                style={{ fontSize: '18px' }}
                                            >
                                                {categoryConfig[file.category]
                                                    ?.icon || '📎'}
                                            </td>
                                            <td>
                                                <div
                                                    style={{ fontWeight: 600 }}
                                                >
                                                    {file.name}
                                                </div>
                                                {file.description && (
                                                    <div
                                                        className="text-muted"
                                                        style={{
                                                            fontSize: '11px',
                                                        }}
                                                    >
                                                        {file.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span
                                                    className="label label-default"
                                                    style={{ fontWeight: 400 }}
                                                >
                                                    {
                                                        categoryConfig[
                                                            file.category
                                                        ]?.label
                                                    }
                                                </span>
                                            </td>
                                            <td className="text-muted">
                                                {formatFileSize(file.size)}
                                            </td>
                                            <td className="text-muted">
                                                {new Date(
                                                    file.createdAt,
                                                ).toLocaleDateString('pl-PL')}
                                                {file.uploadedBy && (
                                                    <div
                                                        style={{
                                                            fontSize: '10px',
                                                        }}
                                                    >
                                                        przez:{' '}
                                                        {file.uploadedBy.name}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="btn-group">
                                                    <button
                                                        onClick={() =>
                                                            handleDownload(file)
                                                        }
                                                        className="btn btn-default btn-xs"
                                                        title="Pobierz"
                                                    >
                                                        <i className="fa fa-download"></i>{' '}
                                                        ↓
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                file.id,
                                                            )
                                                        }
                                                        className="btn btn-danger btn-xs"
                                                        title="Usuń"
                                                    >
                                                        <i className="fa fa-trash"></i>{' '}
                                                        🗑
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div
                                className="text-center text-muted"
                                style={{ padding: '60px 0' }}
                            >
                                <div
                                    style={{
                                        fontSize: '32px',
                                        marginBottom: '10px',
                                    }}
                                >
                                    📁
                                </div>
                                <p
                                    style={{
                                        fontSize: '14px',
                                        marginBottom: '5px',
                                    }}
                                >
                                    {filterCategory === 'all'
                                        ? 'Brak dokumentów klienta.'
                                        : `Brak dokumentów w kategorii "${categoryConfig[filterCategory as FileCategory].label}".`}
                                </p>
                                <p style={{ fontSize: '11px' }}>
                                    Dodaj zgody, umowy lub inne dokumenty
                                    związane z klientem.
                                </p>
                                <button
                                    onClick={handleUpload}
                                    className="btn btn-default btn-xs"
                                    style={{ marginTop: '15px' }}
                                >
                                    Dodaj pierwszy dokument
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
