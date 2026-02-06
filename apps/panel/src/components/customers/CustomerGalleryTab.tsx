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
                                        className="col-sm-3"
                                        style={{ marginBottom: '15px' }}
                                    >
                                        <div
                                            className="versum-panel-sub"
                                            style={{
                                                padding: '0',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                border: '1px solid #ddd',
                                            }}
                                            onClick={() =>
                                                setSelectedImage(image)
                                            }
                                        >
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    paddingTop: '100%',
                                                }}
                                            >
                                                <img
                                                    src={
                                                        image.thumbnailUrl ||
                                                        image.url
                                                    }
                                                    alt={
                                                        image.description ||
                                                        'Zdjęcie klienta'
                                                    }
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            </div>
                                            {image.serviceName && (
                                                <div
                                                    style={{
                                                        padding: '5px',
                                                        fontSize: '11px',
                                                        borderTop:
                                                            '1px solid #eee',
                                                        background: '#f9f9f9',
                                                    }}
                                                >
                                                    {image.serviceName}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                    📷
                                </div>
                                <p
                                    style={{
                                        fontSize: '14px',
                                        marginBottom: '5px',
                                    }}
                                >
                                    Brak zdjęć w galerii klienta.
                                </p>
                                <p style={{ fontSize: '11px' }}>
                                    Dodaj zdjęcia efektów zabiegów, aby
                                    dokumentować historię klienta.
                                </p>
                                <button
                                    onClick={handleUpload}
                                    className="btn btn-default btn-xs"
                                    style={{ marginTop: '15px' }}
                                >
                                    Dodaj pierwsze zdjęcie
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal (Simplified) */}
            {selectedImage && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1050,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.8)',
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        style={{
                            position: 'relative',
                            maxWidth: '90%',
                            maxHeight: '90%',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            style={{
                                position: 'absolute',
                                right: '-15px',
                                top: '-15px',
                                background: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '30px',
                                height: '30px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                            }}
                        >
                            ✕
                        </button>
                        <img
                            src={selectedImage.url}
                            alt={selectedImage.description || 'Zdjęcie klienta'}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '85vh',
                                borderRadius: '2px',
                                boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                            }}
                        />
                        {(selectedImage.description ||
                            selectedImage.serviceName) && (
                            <div
                                style={{
                                    background: '#fff',
                                    padding: '15px',
                                    marginTop: '5px',
                                    borderRadius: '2px',
                                }}
                            >
                                {selectedImage.serviceName && (
                                    <div style={{ fontWeight: 600 }}>
                                        {selectedImage.serviceName}
                                    </div>
                                )}
                                {selectedImage.description && (
                                    <div
                                        style={{
                                            fontSize: '12px',
                                            color: '#666',
                                        }}
                                    >
                                        {selectedImage.description}
                                    </div>
                                )}
                                <div
                                    style={{
                                        fontSize: '11px',
                                        color: '#999',
                                        marginTop: '5px',
                                    }}
                                >
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
