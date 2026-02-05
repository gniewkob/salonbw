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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                    Galeria klienta
                </h3>
                <button
                    onClick={handleUpload}
                    className="rounded bg-cyan-600 px-3 py-1.5 text-sm text-white hover:bg-cyan-700"
                >
                    + Dodaj zdjęcie
                </button>
            </div>

            {/* Gallery Grid */}
            {images.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {images.map((image) => (
                        <div
                            key={image.id}
                            className="group relative aspect-square overflow-hidden rounded-lg border bg-gray-100"
                        >
                            <img
                                src={image.thumbnailUrl || image.url}
                                alt={image.description || 'Zdjęcie klienta'}
                                className="h-full w-full cursor-pointer object-cover transition-transform group-hover:scale-105"
                                onClick={() => setSelectedImage(image)}
                            />
                            {/* Overlay with actions */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedImage(image)}
                                        className="rounded bg-white/90 px-3 py-1 text-sm text-gray-700 hover:bg-white"
                                    >
                                        Podgląd
                                    </button>
                                    <button
                                        onClick={() => handleDelete(image.id)}
                                        className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                                    >
                                        Usuń
                                    </button>
                                </div>
                            </div>
                            {/* Service badge */}
                            {image.serviceName && (
                                <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                                    {image.serviceName}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-lg border bg-gray-50 p-8 text-center">
                    <div className="mb-2 text-4xl">📷</div>
                    <p className="text-gray-500">
                        Brak zdjęć w galerii klienta.
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                        Dodaj zdjęcia efektów zabiegów, aby dokumentować
                        historię klienta.
                    </p>
                    <button
                        onClick={handleUpload}
                        className="mt-4 rounded bg-cyan-600 px-4 py-2 text-sm text-white hover:bg-cyan-700"
                    >
                        Dodaj pierwsze zdjęcie
                    </button>
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="relative max-h-[90vh] max-w-[90vw]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -right-3 -top-3 z-10 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100"
                        >
                            ✕
                        </button>
                        <img
                            src={selectedImage.url}
                            alt={selectedImage.description || 'Zdjęcie klienta'}
                            className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
                        />
                        {(selectedImage.description ||
                            selectedImage.serviceName) && (
                            <div className="mt-2 rounded bg-white/90 p-3 text-sm">
                                {selectedImage.serviceName && (
                                    <p className="font-medium text-gray-700">
                                        {selectedImage.serviceName}
                                    </p>
                                )}
                                {selectedImage.description && (
                                    <p className="text-gray-500">
                                        {selectedImage.description}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-400">
                                    {new Date(
                                        selectedImage.createdAt,
                                    ).toLocaleDateString('pl-PL')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
