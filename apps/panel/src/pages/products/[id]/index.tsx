'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/router';
import ProductViewShell from '@/components/warehouse/ProductViewShell';
import { useProductCard } from '@/hooks/useWarehouseViews';

function formatCurrency(value: number) {
    return `${Number(value ?? 0).toFixed(2)} zł`;
}

export default function ProductCardPage() {
    const router = useRouter();
    const productId = useMemo(() => {
        const value = router.query.id;
        const parsed = Number(Array.isArray(value) ? value[0] : value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }, [router.query.id]);

    const { data, isLoading } = useProductCard(productId);
    const productName = data?.product?.name ?? `#${productId ?? ''}`;

    return (
        <ProductViewShell
            productId={productId ?? 0}
            productLabel={productName}
            activeTab="card"
        >
            {isLoading || !data ? (
                <p className="py-6 text-sm text-gray-500">
                    Ładowanie karty produktu...
                </p>
            ) : (
                <div className="space-y-6 text-sm">
                    <h2 className="text-[44px] leading-none text-gray-800">
                        {data.product.name} (
                        {data.metadata.packageSize ??
                            data.product.packageSize ??
                            '-'}{' '}
                        {data.metadata.packageUnit ??
                            data.product.packageUnit ??
                            ''}
                        )
                    </h2>

                    <div className="grid gap-6 md:grid-cols-2">
                        <section>
                            <h3 className="mb-2 text-base font-semibold">
                                dane magazynowe
                            </h3>
                            <dl className="space-y-1 text-gray-700">
                                <div className="flex justify-between gap-3">
                                    <dt>Stan magazynowy</dt>
                                    <dd>
                                        {data.stock.quantity} {data.stock.unit}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt>Minimalny stan magazynowy</dt>
                                    <dd>
                                        {data.stock.minQuantity ?? 'nie podano'}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt>Wartość sztuk w magazynie</dt>
                                    <dd>
                                        {formatCurrency(
                                            data.stock.stockValueGross,
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </section>

                        <section>
                            <h3 className="mb-2 text-base font-semibold">
                                sprzedaż produktu
                            </h3>
                            <dl className="space-y-1 text-gray-700">
                                <div className="flex justify-between gap-3">
                                    <dt>Cena sprzedaży</dt>
                                    <dd>
                                        {formatCurrency(data.pricing.saleGross)}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt>VAT</dt>
                                    <dd>{data.pricing.vatRate}%</dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt>Cena sprzedaży netto</dt>
                                    <dd>
                                        {formatCurrency(data.pricing.saleNet)}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt>Cena zakupu (ostatnia)</dt>
                                    <dd>
                                        {formatCurrency(
                                            data.pricing.purchaseGross,
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </section>
                    </div>

                    <section>
                        <h3 className="mb-2 text-base font-semibold">
                            dane ogólne
                        </h3>
                        <dl className="grid gap-x-8 gap-y-1 md:grid-cols-2">
                            <div className="flex justify-between gap-3">
                                <dt>Nazwa</dt>
                                <dd>{data.product.name}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt>Rodzaj produktu</dt>
                                <dd>{data.product.productType ?? 'towar'}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt>Kategoria</dt>
                                <dd>
                                    {data.metadata.category ?? 'nie podano'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt>Kod wewnętrzny (SKU)</dt>
                                <dd>{data.metadata.sku ?? 'nie podano'}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt>Producent</dt>
                                <dd>
                                    {data.metadata.manufacturer ??
                                        data.product.brand ??
                                        'nie podano'}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt>Jednostka</dt>
                                <dd>{data.stock.unit}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt>Wielkość opakowania</dt>
                                <dd>
                                    {data.metadata.packageSize ?? '-'}{' '}
                                    {data.metadata.packageUnit ?? ''}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt>Opis</dt>
                                <dd>
                                    {data.product.description ?? 'nie podano'}
                                </dd>
                            </div>
                        </dl>
                    </section>
                </div>
            )}
        </ProductViewShell>
    );
}
