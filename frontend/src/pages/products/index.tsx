import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import Layout from '@/components/Layout';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import ProductForm from '@/components/ProductForm';
import { useProducts } from '@/hooks/useProducts';
import { useProductApi } from '@/api/products';
import { Product } from '@/types';

export default function ProductsPage() {
  const { data } = useProducts();
  const api = useProductApi();
  const [rows, setRows] = useState<Product[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  if (data && rows.length === 0) setRows(data);

  const columns: Column<Product>[] = [
    { header: 'ID', accessor: 'id' },
    { header: 'Name', accessor: 'name' },
    { header: 'Brand', accessor: 'brand' },
    { header: 'Price', accessor: 'unitPrice' },
    { header: 'Stock', accessor: 'stock' },
  ];

  const handleCreate = async (values: { name: string; unitPrice: number; stock: number; brand?: string }) => {
    const created = await api.create(values);
    setRows((c) => [...c, created]);
    setOpenForm(false);
  };

  const handleUpdate = async (values: { name: string; unitPrice: number; stock: number; brand?: string }) => {
    if (!editing) return;
    const updated = await api.update(editing.id, values);
    setRows((c) => c.map((cl) => (cl.id === editing.id ? updated : cl)));
    setEditing(null);
    setOpenForm(false);
  };

  const handleDelete = async (row: Product) => {
    if (!confirm(`Delete ${row.name}?`)) return;
    await api.remove(row.id);
    setRows((c) => c.filter((cl) => cl.id !== row.id));
  };

  return (
    <RouteGuard>
      <Layout>
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
                <button className="border px-2 py-1" onClick={() => handleDelete(r)}>
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
      </Layout>
    </RouteGuard>
  );
}
