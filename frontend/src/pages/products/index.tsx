import { useEffect, useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import ProductForm from '@/components/ProductForm';
import StockForm from '@/components/StockForm';
import { useProducts } from '@/hooks/useProducts';
import { useProductApi } from '@/api/products';
import { Product } from '@/types';
import { testLog } from '@/utils/testLogger';

export default function ProductsPage() {
    const { data } = useProducts();
    const api = useProductApi();
    const [rows, setRows] = useState<Product[]>([]);
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [stockProd, setStockProd] = useState<Product | null>(null);

    // Initialize rows from API data once it arrives (and whenever API data changes)
    useEffect(() => {
        if (data) {
            testLog.debug('ProductsPage: initializing rows from data', {
                count: data.length,
            });
            setRows(data);
        }
    }, [data]);

    const columns: Column<Product>[] = [
        { header: 'ID', accessor: 'id' },
        { header: 'Name', accessor: 'name' },
        { header: 'Brand', accessor: 'brand' },
        { header: 'Price', accessor: 'unitPrice' },
        { header: 'Stock', accessor: 'stock' },
        { header: 'Low Threshold', accessor: 'lowStockThreshold' },
    ];

    const handleCreate = async (values: {
        name: string;
        unitPrice: number;
        stock: number;
        lowStockThreshold: number;
        brand?: string;
    }) => {
        testLog.info('ProductsPage: creating product', values);
        const created = await api.create(values);
        testLog.info('ProductsPage: created product', created);
        setRows((c) => [...c, created]);
        setOpenForm(false);
    };

    const handleUpdate = async (values: {
        name: string;
        unitPrice: number;
        stock: number;
        lowStockThreshold: number;
        brand?: string;
    }) => {
        if (!editing) return;
        testLog.info('ProductsPage: updating product', {
            id: editing.id,
            values,
        });
        const updated = await api.update(editing.id, values);
        testLog.info('ProductsPage: updated product', updated);
        setRows((c) => c.map((cl) => (cl.id === editing.id ? updated : cl)));
        setEditing(null);
        setOpenForm(false);
    };

    const handleStockUpdate = async (amount: number) => {
        if (!stockProd) return;
        testLog.info('ProductsPage: updating stock', {
            id: stockProd.id,
            amount,
        });
        const updated = await api.updateStock(stockProd.id, amount);
        testLog.info('ProductsPage: updated stock', updated);
        setRows((c) => c.map((cl) => (cl.id === stockProd.id ? updated : cl)));
        setStockProd(null);
    };

    const handleDelete = async (row: Product) => {
        if (!confirm(`Delete ${row.name}?`)) return;
        try {
            testLog.info('ProductsPage: deleting product', { id: row.id });
            await api.remove(row.id);
            setRows((c) => c.filter((cl) => cl.id !== row.id));
            testLog.info('ProductsPage: deleted product', { id: row.id });
        } catch {
            // error toast handled in api
        }
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:products">
            <DashboardLayout>
                <div className="mb-2 flex justify-end">
                    <button
                        className="border px-2 py-1"
                        onClick={() => {
                            setEditing(null);
                            setOpenForm(true);
                        }}
                    >
                        Add Product
                    </button>
                </div>
                {rows && (
                    <DataTable
                        data={rows}
                        columns={columns}
                        initialSort="id"
                        renderActions={(r) => (
                            <span className="space-x-2">
                                <button
                                    className="border px-2 py-1"
                                    onClick={() => {
                                        setEditing(r);
                                        setOpenForm(true);
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    className="border px-2 py-1"
                                    onClick={() => setStockProd(r)}
                                >
                                    Stock
                                </button>
                                <button
                                    className="border px-2 py-1"
                                    onClick={() => void handleDelete(r)}
                                >
                                    Delete
                                </button>
                            </span>
                        )}
                    />
                )}
                <Modal
                    open={openForm || Boolean(editing)}
                    onClose={() => {
                        setOpenForm(false);
                        setEditing(null);
                    }}
                >
                    <ProductForm
                        initial={editing ?? undefined}
                        onCancel={() => {
                            setOpenForm(false);
                            setEditing(null);
                        }}
                        onSubmit={editing ? handleUpdate : handleCreate}
                    />
                </Modal>
                <Modal
                    open={Boolean(stockProd)}
                    onClose={() => setStockProd(null)}
                >
                    <StockForm
                        onCancel={() => setStockProd(null)}
                        onSubmit={handleStockUpdate}
                    />
                </Modal>
            </DashboardLayout>
        </RouteGuard>
    );
}
