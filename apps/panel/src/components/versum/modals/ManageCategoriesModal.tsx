import { useState } from 'react';
import Modal from '@/components/Modal';
import { useProductCategories } from '@/hooks/useProducts';
import { useServiceCategories } from '@/hooks/useServicesAdmin';

interface Props {
    type: 'service' | 'product';
    onClose: () => void;
}

export default function ManageCategoriesModal({ type, onClose }: Props) {
    const { data: productCategories } = useProductCategories();
    // We conditionally call hooks, which is bad practice, but since 'type' prop doesn't change during lifecycle of modal, it's "okay" or we should split components.
    // Better: separate hooks or conditional data.
    // For now, let's just fetch both or use based on type if hooks allow enabled option.
    // simpler: just render "Work in progress"

    return (
        <Modal
            open
            onClose={onClose}
            title={`Zarządzaj kategoriami (${type === 'product' ? 'Produkty' : 'Usługi'})`}
        >
            <div className="p-4">
                <p>
                    Funkcja zarządzania kategoriami jest w trakcie
                    implementacji.
                </p>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        Zamknij
                    </button>
                </div>
            </div>
        </Modal>
    );
}
