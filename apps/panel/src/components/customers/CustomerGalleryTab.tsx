'use client';

import { useState } from 'react';
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
    const { data: images = [], isLoading } = useCustomerGallery(customerId);
    const upload = useUploadCustomerGalleryImage(customerId);
    const del = useDeleteCustomerGalleryImage(customerId);

    const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
    const selectedImage =
        selectedImageId !== null
            ? (images.find((img) => img.id === selectedImageId) ?? null)
            : null;

    const base = getBrowserApiBase();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Ładowanie galerii...</div>
            </div>
        );
    }

    return (
        <div className="row">
            <div className="col-sm-12">
                <div className="versum-widget">
                    <div className="versum-widget__header flex-between">
                        <span>Galeria klienta</span>
                        <label className="btn btn-primary btn-xs m-0">
                            + Dodaj zdjęcie
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
                        {images.length > 0 ? (
                            <div className="row">
                                {images.map((image) => (
                                    <div
                                        key={image.id}
                                        className="col-sm-3 mb-15"
                                    >
                                        <div
                                            className="versum-panel-sub p-0 overflow-hidden cursor-pointer border"
                                            onClick={() =>
                                                setSelectedImageId(image.id)
                                            }
                                        >
                                            <div className="aspect-square">
                                                <img
                                                    src={`${base}${image.thumbnailUrl}`}
                                                    alt={
                                                        image.description ||
                                                        'Zdjęcie klienta'
                                                    }
                                                    className="absolute-fill object-cover"
                                                />
                                            </div>
                                            {image.serviceId && (
                                                <div className="p-5 fz-11 border-top-eee bg-f9">
                                                    usługa #{image.serviceId}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-60-0">
                                <div className="fz-32 mb-10">📷</div>
                                <p className="fz-14 mb-5">
                                    Brak zdjęć w galerii klienta.
                                </p>
                                <p className="fz-11">
                                    Dodaj zdjęcia efektów zabiegów, aby
                                    dokumentować historię klienta.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedImage && (
                <div
                    className="modal fade in block bg-modal-overlay flex-center"
                    onClick={() => setSelectedImageId(null)}
                >
                    <div
                        className="relative max-w-90 max-h-90"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedImageId(null)}
                            className="abs-tr--15 bg-white br-full w-30 h-30 cursor-pointer fw-bold border-none"
                            title="Zamknij"
                        >
                            ✕
                        </button>
                        <button
                            onClick={() => {
                                if (
                                    confirm(
                                        'Czy na pewno chcesz usunąć to zdjęcie?',
                                    )
                                ) {
                                    void del.mutateAsync(selectedImage.id);
                                    setSelectedImageId(null);
                                }
                            }}
                            className="abs-tr--55 bg-white br-2 px-10 py-6 cursor-pointer fw-600 border-none"
                            title="Usuń"
                            disabled={del.isPending}
                        >
                            Usuń
                        </button>
                        <img
                            src={`${base}${selectedImage.url}`}
                            alt={selectedImage.description || 'Zdjęcie klienta'}
                            className="max-w-full max-h-85vh br-2 shadow-modal"
                        />
                        {(selectedImage.description ||
                            selectedImage.serviceId) && (
                            <div className="bg-white p-15 mt-5 br-2">
                                {selectedImage.serviceId && (
                                    <div className="fw-600">
                                        usługa #{selectedImage.serviceId}
                                    </div>
                                )}
                                {selectedImage.description && (
                                    <div className="fz-12 text-666">
                                        {selectedImage.description}
                                    </div>
                                )}
                                <div className="fz-11 text-999 mt-5">
                                    {new Date(
                                        selectedImage.createdAt,
                                    ).toLocaleDateString('pl-PL')}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
