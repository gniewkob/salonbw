'use client';

import { useState } from 'react';

interface Props {
    customerId: number;
}

interface GalleryImage {
    id: number;
    url: string;
    thumbnailUrl: string;
    description?: string;
    createdAt: string;
    serviceId?: number;
    serviceName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
export default function CustomerGalleryTab({ customerId }: Props) {
    const [images] = useState<GalleryImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(
        null,
    );
    const isLoading = false;

    // TODO: Integrate with API when backend supports customer gallery
    // const { data: images, isLoading } = useCustomerGallery(customerId);
    // const uploadImage = useUploadCustomerImage();
    // const deleteImage = useDeleteCustomerImage();

    const handleUpload = () => {
        // TODO: Implement file upload
        alert('Funkcja dodawania zdjęć będzie dostępna wkrótce');
    };

    const handleDelete = (imageId: number) => {
        if (!confirm('Czy na pewno chcesz usunąć to zdjęcie?')) return;
        // TODO: Implement delete
        console.log('Delete image:', imageId);
    };

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
                        <button
                            onClick={handleUpload}
                            className="btn btn-primary btn-xs"
                        >
                            + Dodaj zdjęcie
                        </button>
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
                                                setSelectedImage(image)
                                            }
                                        >
                                            <div className="aspect-square">
                                                <img
                                                    src={
                                                        image.thumbnailUrl ||
                                                        image.url
                                                    }
                                                    alt={
                                                        image.description ||
                                                        'Zdjęcie klienta'
                                                    }
                                                    className="absolute-fill object-cover"
                                                />
                                            </div>
                                            {image.serviceName && (
                                                <div className="p-5 fz-11 border-top-eee bg-f9">
                                                    {image.serviceName}
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
                                <button
                                    onClick={handleUpload}
                                    className="btn btn-default btn-xs mt-15"
                                >
                                    Dodaj pierwsze zdjęcie
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedImage && (
                <div
                    className="modal fade in block bg-modal-overlay flex-center"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="relative max-w-90 max-h-90"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="abs-tr--15 bg-white br-full w-30 h-30 cursor-pointer fw-bold border-none"
                            title="Zamknij"
                        >
                            ✕
                        </button>
                        <img
                            src={selectedImage.url}
                            alt={selectedImage.description || 'Zdjęcie klienta'}
                            className="max-w-full max-h-85vh br-2 shadow-modal"
                        />
                        {(selectedImage.description ||
                            selectedImage.serviceName) && (
                            <div className="bg-white p-15 mt-5 br-2">
                                {selectedImage.serviceName && (
                                    <div className="fw-600">
                                        {selectedImage.serviceName}
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
