'use client';

import { useMemo, useState } from 'react';
import {
    getBrowserApiBase,
    useCustomerGallery,
    useDeleteCustomerGalleryImage,
    useUploadCustomerGalleryImage,
} from '@/hooks/useCustomerMedia';

interface Props {
    customerId: number;
}

export default function CustomerGalleryTab({ customerId }: Props) {
    const {
        data: images = [],
        isLoading,
        error,
    } = useCustomerGallery(customerId);
    const upload = useUploadCustomerGalleryImage(customerId);
    const del = useDeleteCustomerGalleryImage(customerId);

    const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
    const selectedImage = useMemo(() => {
        if (selectedImageId === null) return null;
        return images.find((img) => img.id === selectedImageId) ?? null;
    }, [images, selectedImageId]);

    const base = getBrowserApiBase();

    if (isLoading) {
        return <div className="customer-loading">Ładowanie galerii...</div>;
    }

    if (error) {
        return (
            <div className="customer-error">
                <p>Nie udało się załadować galerii</p>
            </div>
        );
    }

    return (
        <div className="row customer-gallery-tab">
            <div className="col-sm-12">
                <div className="versum-widget">
                    <div className="versum-widget__header flex-between">
                        <span>galeria zdjęć</span>
                        <label className="btn btn-primary btn-xs m-0">
                            dodaj zdjęcie
                            <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) => {
                                    const image = e.target.files?.[0];
                                    if (!image) return;
                                    void upload.mutateAsync({ image });
                                    e.currentTarget.value = '';
                                }}
                                disabled={upload.isPending}
                            />
                        </label>
                    </div>

                    <div className="versum-widget__content">
                        {images.length === 0 ? (
                            <div className="customer-empty-state">
                                Brak zdjęć w galerii klienta.
                            </div>
                        ) : (
                            <div className="row">
                                {images.map((image) => (
                                    <div
                                        key={image.id}
                                        className="col-xs-6 col-sm-3 mb-15"
                                    >
                                        <button
                                            type="button"
                                            className="customer-gallery-thumb"
                                            onClick={() =>
                                                setSelectedImageId(image.id)
                                            }
                                            title="Podgląd"
                                        >
                                            <img
                                                src={`${base}${image.thumbnailUrl}`}
                                                alt={
                                                    image.description ||
                                                    'Zdjęcie klienta'
                                                }
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedImage ? (
                <div
                    className="modal fade in customer-modal-open"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setSelectedImageId(null)}
                >
                    <div
                        className="modal-dialog modal-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <button
                                    type="button"
                                    className="close"
                                    onClick={() => setSelectedImageId(null)}
                                    aria-label="Zamknij"
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button>
                                <h4 className="modal-title">Podgląd zdjęcia</h4>
                            </div>
                            <div className="modal-body">
                                <div className="text-center">
                                    <img
                                        src={`${base}${selectedImage.url}`}
                                        alt={
                                            selectedImage.description ||
                                            'Zdjęcie klienta'
                                        }
                                        className="customer-gallery-full"
                                    />
                                </div>

                                {selectedImage.description ? (
                                    <div className="mt-15">
                                        <div className="text-muted fz-11">
                                            opis
                                        </div>
                                        <div className="fz-12">
                                            {selectedImage.description}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-default btn-sm"
                                    onClick={() => setSelectedImageId(null)}
                                >
                                    zamknij
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    disabled={del.isPending}
                                    onClick={() => {
                                        if (
                                            !confirm(
                                                'Czy na pewno chcesz usunąć to zdjęcie?',
                                            )
                                        ) {
                                            return;
                                        }
                                        void del
                                            .mutateAsync(selectedImage.id)
                                            .then(() =>
                                                setSelectedImageId(null),
                                            );
                                    }}
                                >
                                    usuń
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
