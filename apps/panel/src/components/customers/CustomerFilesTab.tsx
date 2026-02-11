'use client';

import { useMemo, useState } from 'react';
import {
    getBrowserApiBase,
    useCustomerFiles,
    useDeleteCustomerFile,
    useUploadCustomerFile,
    type CustomerFileCategory,
} from '@/hooks/useCustomerMedia';

interface Props {
    customerId: number;
}

const categoryConfig: Record<
    CustomerFileCategory,
    { label: string; icon: string; color: string }
> = {
    consent: {
        label: 'Zgoda',
        icon: 'glyphicon glyphicon-pencil',
        color: 'bg-green-100 text-green-700',
    },
    contract: {
        label: 'Umowa',
        icon: 'glyphicon glyphicon-file',
        color: 'bg-blue-100 text-blue-700',
    },
    medical: {
        label: 'Dokumentacja medyczna',
        icon: 'glyphicon glyphicon-plus-sign',
        color: 'bg-purple-100 text-purple-700',
    },
    invoice: {
        label: 'Faktura',
        icon: 'glyphicon glyphicon-list-alt',
        color: 'bg-yellow-100 text-yellow-700',
    },
    other: {
        label: 'Inne',
        icon: 'glyphicon glyphicon-paperclip',
        color: 'bg-gray-100 text-gray-700',
    },
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CustomerFilesTab({ customerId }: Props) {
    const { data: files = [], isLoading } = useCustomerFiles(customerId);
    const upload = useUploadCustomerFile(customerId);
    const del = useDeleteCustomerFile(customerId);

    const [filterCategory, setFilterCategory] = useState<
        CustomerFileCategory | 'all'
    >('all');

    const filteredFiles = useMemo(() => {
        return filterCategory === 'all'
            ? files
            : files.filter((f) => f.category === filterCategory);
    }, [files, filterCategory]);

    const base = getBrowserApiBase();

    const handleDownload = (downloadUrl: string) => {
        window.open(`${base}${downloadUrl}`, '_blank', 'noopener,noreferrer');
    };

    const handleDelete = async (fileId: number) => {
        if (!confirm('Czy na pewno chcesz usunąć ten plik?')) return;
        await del.mutateAsync(fileId);
    };

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
                        <label className="btn btn-primary btn-xs m-0">
                            + Dodaj plik
                            <input
                                type="file"
                                className="sr-only"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    void upload.mutateAsync({
                                        file,
                                        category: 'other',
                                    });
                                    e.currentTarget.value = '';
                                }}
                                disabled={upload.isPending}
                            />
                        </label>
                    </div>

                    <div className="versum-widget__content">
                        {/* Category Filter */}
                        <div className="mb-20 border-bottom pb-10">
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
                                                    key as CustomerFileCategory,
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
                            <table className="versum-table fz-13">
                                <thead>
                                    <tr>
                                        <th className="w-40"></th>
                                        <th>Nazwa pliku</th>
                                        <th>Kategoria</th>
                                        <th>Rozmiar</th>
                                        <th>Data dodania</th>
                                        <th className="w-80">Opcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFiles.map((file) => (
                                        <tr key={file.id}>
                                            <td className="text-center fz-18">
                                                <i
                                                    className={
                                                        categoryConfig[
                                                            file.category
                                                        ]?.icon ||
                                                        'glyphicon glyphicon-paperclip'
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <div className="bold">
                                                    {file.name}
                                                </div>
                                                {file.description && (
                                                    <div className="text-muted fz-11">
                                                        {file.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span className="label label-default regular">
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
                                            </td>
                                            <td>
                                                <div className="btn-group">
                                                    <button
                                                        onClick={() =>
                                                            handleDownload(
                                                                file.downloadUrl,
                                                            )
                                                        }
                                                        className="btn btn-default btn-xs"
                                                        title="Pobierz plik"
                                                        aria-label="Pobierz plik"
                                                    >
                                                        <i className="fa fa-download" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            void handleDelete(
                                                                file.id,
                                                            )
                                                        }
                                                        className="btn btn-danger btn-xs"
                                                        title="Usuń plik"
                                                        aria-label="Usuń plik"
                                                        disabled={del.isPending}
                                                    >
                                                        <i className="fa fa-trash" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center text-muted p-60-0">
                                <p className="fz-14 mb-5">
                                    {filterCategory === 'all'
                                        ? 'Brak dokumentów klienta.'
                                        : `Brak dokumentów w kategorii "${categoryConfig[filterCategory as CustomerFileCategory].label}".`}
                                </p>
                                <p className="fz-11">
                                    Dodaj zgody, umowy lub inne dokumenty
                                    związane z klientem.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
