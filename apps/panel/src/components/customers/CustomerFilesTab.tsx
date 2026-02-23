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
    { label: string; icon: string; labelClass: string }
> = {
    consent: {
        label: 'Zgoda',
        icon: 'glyphicon glyphicon-pencil',
        labelClass: 'label label-default',
    },
    contract: {
        label: 'Umowa',
        icon: 'glyphicon glyphicon-file',
        labelClass: 'label label-default',
    },
    medical: {
        label: 'Dokumentacja',
        icon: 'glyphicon glyphicon-plus-sign',
        labelClass: 'label label-default',
    },
    invoice: {
        label: 'Faktura',
        icon: 'glyphicon glyphicon-list-alt',
        labelClass: 'label label-default',
    },
    other: {
        label: 'Inne',
        icon: 'glyphicon glyphicon-paperclip',
        labelClass: 'label label-default',
    },
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CustomerFilesTab({ customerId }: Props) {
    const { data: filesRaw, isLoading, error } = useCustomerFiles(customerId);
    const upload = useUploadCustomerFile(customerId);
    const del = useDeleteCustomerFile(customerId);
    const files = useMemo(
        () => (Array.isArray(filesRaw) ? filesRaw : []),
        [filesRaw],
    );

    const [filterCategory, setFilterCategory] = useState<
        CustomerFileCategory | 'all'
    >('all');
    const [uploadCategory, setUploadCategory] =
        useState<CustomerFileCategory>('other');

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
        return <div className="customer-loading">Ładowanie plików...</div>;
    }

    if (error) {
        return (
            <div className="customer-error">
                <p>Nie udało się załadować plików klienta</p>
            </div>
        );
    }

    return (
        <div className="row customer-files-tab">
            <div className="col-sm-12">
                <div className="versum-widget">
                    <div className="versum-widget__header flex-between">
                        <span>załączone pliki</span>
                        <div className="flex-between gap-8">
                            <select
                                className="form-control input-sm"
                                value={uploadCategory}
                                onChange={(e) =>
                                    setUploadCategory(
                                        e.target.value as CustomerFileCategory,
                                    )
                                }
                            >
                                {Object.entries(categoryConfig).map(
                                    ([key, cfg]) => (
                                        <option key={key} value={key}>
                                            {cfg.label}
                                        </option>
                                    ),
                                )}
                            </select>
                            <label className="btn btn-primary btn-xs m-0">
                                dodaj plik
                                <input
                                    type="file"
                                    className="sr-only"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        void upload.mutateAsync({
                                            file,
                                            category: uploadCategory,
                                        });
                                        e.currentTarget.value = '';
                                    }}
                                    disabled={upload.isPending}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="versum-widget__content">
                        <div className="customer-files-toolbar">
                            <div className="btn-group">
                                <button
                                    type="button"
                                    onClick={() => setFilterCategory('all')}
                                    className={`btn btn-xs ${filterCategory === 'all' ? 'btn-primary' : 'btn-default'}`}
                                >
                                    wszystkie
                                </button>
                                {Object.entries(categoryConfig).map(
                                    ([key, config]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() =>
                                                setFilterCategory(
                                                    key as CustomerFileCategory,
                                                )
                                            }
                                            className={`btn btn-xs ${filterCategory === key ? 'btn-primary' : 'btn-default'}`}
                                        >
                                            {config.label.toLowerCase()}
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>

                        {filteredFiles.length === 0 ? (
                            <div className="customer-empty-state">
                                {filterCategory === 'all'
                                    ? 'Brak dokumentów klienta.'
                                    : `Brak dokumentów w kategorii "${categoryConfig[filterCategory as CustomerFileCategory].label}".`}
                            </div>
                        ) : (
                            <div className="versum-table-wrap">
                                <table className="versum-table fz-13">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 40 }}></th>
                                            <th>Nazwa pliku</th>
                                            <th>Kategoria</th>
                                            <th>Rozmiar</th>
                                            <th>Data dodania</th>
                                            <th style={{ width: 80 }}>Opcje</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFiles.map((file) => {
                                            const cfg =
                                                categoryConfig[file.category] ??
                                                categoryConfig.other;
                                            return (
                                                <tr key={file.id}>
                                                    <td className="text-center fz-18">
                                                        <i
                                                            className={cfg.icon}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div className="bold">
                                                            {file.name}
                                                        </div>
                                                        {file.description ? (
                                                            <div className="text-muted fz-11">
                                                                {
                                                                    file.description
                                                                }
                                                            </div>
                                                        ) : null}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`${cfg.labelClass} regular`}
                                                        >
                                                            {cfg.label}
                                                        </span>
                                                    </td>
                                                    <td className="text-muted">
                                                        {formatFileSize(
                                                            file.size,
                                                        )}
                                                    </td>
                                                    <td className="text-muted">
                                                        {new Date(
                                                            file.createdAt,
                                                        ).toLocaleDateString(
                                                            'pl-PL',
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="btn-group">
                                                            <button
                                                                type="button"
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
                                                                type="button"
                                                                onClick={() =>
                                                                    void handleDelete(
                                                                        file.id,
                                                                    )
                                                                }
                                                                className="btn btn-danger btn-xs"
                                                                title="Usuń plik"
                                                                aria-label="Usuń plik"
                                                                disabled={
                                                                    del.isPending
                                                                }
                                                            >
                                                                <i className="fa fa-trash" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
