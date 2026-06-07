import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WarehouseLayout from './WarehouseLayout';
import ProductDetailsTabs from './ProductDetailsTabs';
import ConfirmModal from '@/components/ConfirmModal';
import { useDeleteProduct } from '@/hooks/useWarehouseViews';

type ProductViewTab = 'card' | 'history' | 'formulas' | 'commissions';

interface ProductViewShellProps {
    productId: number;
    productLabel: string;
    activeTab: ProductViewTab;
    children: ReactNode;
}

export default function ProductViewShell({
    productId,
    productLabel,
    activeTab,
    children,
}: ProductViewShellProps) {
    const router = useRouter();
    const deleteProduct = useDeleteProduct();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const doDelete = async () => {
        try {
            await deleteProduct.mutateAsync(productId);
            void router.push('/products');
        } catch {
            // toast shown in hook
        }
    };

    const actions = (
        <div className="products-card-actions">
            <Link
                href="/sales/new"
                className="btn btn-outline-secondary btn-sm"
            >
                sprzedaj
            </Link>
            <Link href="/use/new" className="btn btn-outline-secondary btn-sm">
                zużyj
            </Link>
            <Link
                href={`/products/${productId}/edit`}
                className="btn btn-outline-secondary btn-sm"
            >
                edytuj
            </Link>
            <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                disabled={deleteProduct.isPending}
                onClick={() => setConfirmDelete(true)}
            >
                usuń
            </button>
            <Link href="/products/new" className="btn btn-primary btn-sm">
                dodaj produkt
            </Link>
        </div>
    );

    return (
        <WarehouseLayout
            pageTitle={`Magazyn / Produkty / ${productLabel} | SalonBW`}
            heading={`Magazyn / Produkty / ${productLabel}`}
            activeTab="products"
            actions={actions}
        >
            <ProductDetailsTabs productId={productId} activeTab={activeTab} />
            {children}
            <ConfirmModal
                open={confirmDelete}
                title="Usuń produkt"
                message="Czy na pewno chcesz usunąć ten produkt? Operacja jest nieodwracalna."
                confirmLabel="Usuń"
                confirmVariant="danger"
                onConfirm={() => {
                    setConfirmDelete(false);
                    void doDelete();
                }}
                onCancel={() => setConfirmDelete(false)}
            />
        </WarehouseLayout>
    );
}
