interface Props {
    type: 'service' | 'product';
    onClose: () => void;
}

export default function ManageCategoriesModal({ type, onClose }: Props) {
    return (
        <div className="modal-backdrop fade in">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <button
                            type="button"
                            className="close"
                            onClick={onClose}
                            aria-label="Zamknij"
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title">
                            Zarządzaj kategoriami (
                            {type === 'product' ? 'Produkty' : 'Usługi'})
                        </h4>
                    </div>
                    <div className="modal-body">
                        <p>
                            Funkcja zarządzania kategoriami jest w trakcie
                            implementacji.
                        </p>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-default"
                            onClick={onClose}
                        >
                            Zamknij
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
