import { useMemo, useState } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import {
    getBrowserApiBase,
    useCustomerFiles,
    useDeleteCustomerFile,
    useUploadCustomerFile,
    type CustomerFileCategory,
} from '@/hooks/useCustomerMedia';
import EmptyState from '@/components/ui/EmptyState';

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
    const { data, isLoading, error } = useCustomerFiles(customerId);
    const files = useMemo(() => (Array.isArray(data) ? data : []), [data]);
    const upload = useUploadCustomerFile(customerId);
    const del = useDeleteCustomerFile(customerId);

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
                <div className="salonbw-widget">
                    <div className="salonbw-widget__header flex-between">
                        <span>załączone pliki</span>
                        <div className="flex-between gap-8">
                            <select
                                title="Kategoria plików"
                                aria-label="Kategoria plików do dodania"
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
                            <label className="btn btn-primary btn-sm m-0">
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

                    <div className="salonbw-widget__content">
                        <div className="customer-files-toolbar">
                            <div className="btn-group">
                                <button
                                    type="button"
                                    onClick={() => setFilterCategory('all')}
                                    className={`btn btn-sm ${filterCategory === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
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
                                            className={`btn btn-sm ${filterCategory === key ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        >
                                            {config.label.toLowerCase()}
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>

                        {filteredFiles.length === 0 ? (
                            <EmptyState
                                icon={
                                    <DocumentTextIcon
                                        style={{ width: 44, height: 44 }}
                                    />
                                }
                                title={
                                    filterCategory === 'all'
                                        ? 'Brak dokumentów klienta'
                                        : `Brak dokumentów w kategorii "${categoryConfig[filterCategory as CustomerFileCategory].label}"`
                                }
                                description={
                                    filterCategory === 'all'
                                        ? 'Załączenie umowy, zgody RODO czy faktury pojawi się tutaj.'
                                        : 'Wybierz inną kategorię lub załącz nowy dokument.'
                                }
                                compact
                            />
                        ) : (
                            <div className="salonbw-table-wrap">
                                <table className="salonbw-table fz-13">
                                    <thead>
                                        <tr>
                                            <>
                                                <th style={{ width: 40 }}></th>
                                                <th>Nazwa pliku</th>
                                                <th>Kategoria</th>
                                                <th>Rozmiar</th>
                                                <th>Data dodania</th>
                                                <th style={{ width: 80 }}>
                                                    Opcje
                                                </th>
                                            </>
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
                                                            <div className="text-muted small">
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
                                                                className="btn btn-outline-secondary btn-sm"
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
                                                                className="btn btn-danger btn-sm"
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
