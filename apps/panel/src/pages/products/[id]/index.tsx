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
                <p className="products-empty">Ładowanie karty produktu...</p>
            ) : (
                <div className="product-card-view">
                    <h2 className="product-card-view__title">
                        {data.product.name} (
                        {data.metadata.packageSize ??
                            data.product.packageSize ??
                            '-'}{' '}
                        {data.metadata.packageUnit ??
                            data.product.packageUnit ??
                            ''}
                        )
                    </h2>

                    <div className="product-card-view__columns">
                        <section className="product-card-view__panel">
                            <h3>dane magazynowe</h3>
                            <dl>
                                <div>
                                    <dt>Stan magazynowy</dt>
                                    <dd>
                                        {data.stock.quantity} {data.stock.unit}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Minimalny stan magazynowy</dt>
                                    <dd>
                                        {data.stock.minQuantity ?? 'nie podano'}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Wartość sztuk w magazynie</dt>
                                    <dd>
                                        {formatCurrency(
                                            data.stock.stockValueGross,
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </section>

                        <section className="product-card-view__panel">
                            <h3>sprzedaż produktu</h3>
                            <dl>
                                <div>
                                    <dt>Cena sprzedaży</dt>
                                    <dd>
                                        {formatCurrency(data.pricing.saleGross)}
                                    </dd>
                                </div>
                                <div>
                                    <dt>VAT</dt>
                                    <dd>{data.pricing.vatRate}%</dd>
                                </div>
                                <div>
                                    <dt>Cena sprzedaży netto</dt>
                                    <dd>
                                        {formatCurrency(data.pricing.saleNet)}
                                    </dd>
                                </div>
                                <div>
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

                    <section className="product-card-view__panel">
                        <h3>dane ogólne</h3>
                        <dl className="product-card-view__meta">
                            <div>
                                <dt>Nazwa</dt>
                                <dd>{data.product.name}</dd>
                            </div>
                            <div>
                                <dt>Rodzaj produktu</dt>
                                <dd>{data.product.productType ?? 'towar'}</dd>
                            </div>
                            <div>
                                <dt>Kategoria</dt>
                                <dd>
                                    {data.metadata.category ?? 'nie podano'}
                                </dd>
                            </div>
                            <div>
                                <dt>Kod wewnętrzny (SKU)</dt>
                                <dd>{data.metadata.sku ?? 'nie podano'}</dd>
                            </div>
                            <div>
                                <dt>Producent</dt>
                                <dd>
                                    {data.metadata.manufacturer ??
                                        data.product.brand ??
                                        'nie podano'}
                                </dd>
                            </div>
                            <div>
                                <dt>Jednostka</dt>
                                <dd>{data.stock.unit}</dd>
                            </div>
                            <div>
                                <dt>Wielkość opakowania</dt>
                                <dd>
                                    {data.metadata.packageSize ?? '-'}{' '}
                                    {data.metadata.packageUnit ?? ''}
                                </dd>
                            </div>
                            <div>
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
