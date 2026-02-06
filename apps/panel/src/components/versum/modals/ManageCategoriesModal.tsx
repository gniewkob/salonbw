import Modal from '@/components/Modal';

interface Props {
    type: 'service' | 'product';
    onClose: () => void;
}

export default function ManageCategoriesModal({ type, onClose }: Props) {
    return (
        <Modal open onClose={onClose}>
            <div className="p-4">
                <h2 className="text-lg font-semibold mb-4">
                    Zarządzaj kategoriami (
                    {type === 'product' ? 'Produkty' : 'Usługi'})
                </h2>
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
