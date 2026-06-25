import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
    BanknotesIcon,
    CreditCardIcon,
    BuildingLibraryIcon,
    DevicePhoneMobileIcon,
    GiftIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/Modal';
import { CALENDAR_QUERY_KEY } from '@/hooks/useCalendar';
import { APPOINTMENTS_QUERY_KEY } from '@/hooks/useAppointments';
import type {
    Appointment,
    PaymentMethod,
    FinalizeAppointmentRequest,
    ProductSaleItem,
    Product,
    UsageMaterialItem,
    ServiceRecipeItem,
    Service,
} from '@/types';

interface ExtraServiceDraft {
    serviceId: number;
    name: string;
    priceCents: number;
    discountCents: number;
}

interface Props {
    appointment: Appointment | null;
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const PAYMENT_METHODS: {
    value: PaymentMethod;
    label: string;
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
    { value: 'cash', label: 'Gotówka', Icon: BanknotesIcon },
    { value: 'card', label: 'Karta', Icon: CreditCardIcon },
    { value: 'transfer', label: 'Przelew', Icon: BuildingLibraryIcon },
    { value: 'online', label: 'Online', Icon: DevicePhoneMobileIcon },
    { value: 'voucher', label: 'Voucher', Icon: GiftIcon },
];

function PickerSearch({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
}) {
    return (
        <div className="position-relative mb-2">
            <MagnifyingGlassIcon
                aria-hidden="true"
                style={{
                    width: 16,
                    height: 16,
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6e7278',
                    pointerEvents: 'none',
                }}
            />
            <input
                type="search"
                className="form-control form-control-sm"
                style={{ paddingLeft: 32 }}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

// Optional descriptive field that can be both expanded ("+ Dodaj …") and
// collapsed again ("Ukryj") so it doesn't take up space when unused. Collapsing
// only hides the field — any text typed stays in state and is still submitted.
function CollapsibleField({
    open,
    onToggle,
    addLabel,
    label,
    htmlFor,
    children,
}: {
    open: boolean;
    onToggle: () => void;
    addLabel: string;
    label: string;
    htmlFor: string;
    children: React.ReactNode;
}) {
    return (
        <div className="mb-3">
            {!open ? (
                <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-decoration-none"
                    onClick={onToggle}
                >
                    {addLabel}
                </button>
            ) : (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <label
                            htmlFor={htmlFor}
                            className="small fw-medium text-body mb-0"
                        >
                            {label}
                        </label>
                        <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-decoration-none text-muted"
                            onClick={onToggle}
                        >
                            Ukryj
                        </button>
                    </div>
                    {children}
                </>
            )}
        </div>
    );
}

export default function FinalizationModal({
    appointment,
    open,
    onClose,
    onSuccess,
}: Props) {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    // Form state
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
    // Editable service price — pre-filled from the price list (cennik), staff
    // can override it per visit.
    const [servicePricePln, setServicePricePln] = useState<string>('');
    const [servicePrefilled, setServicePrefilled] = useState(false);
    const [discountPln, setDiscountPln] = useState<string>('');
    // Amount the client actually leaves. Blank = pays exactly the amount due;
    // anything above the amount due is automatically the tip.
    const [paidPln, setPaidPln] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [showNote, setShowNote] = useState(false);
    const [clientNote, setClientNote] = useState<string>('');
    const [showClientNote, setShowClientNote] = useState(false);
    const [formula, setFormula] = useState<string>('');
    const [showFormula, setShowFormula] = useState(false);
    const [productSales, setProductSales] = useState<ProductSaleItem[]>([]);
    const [usageMaterials, setUsageMaterials] = useState<UsageMaterialItem[]>(
        [],
    );
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [usageItems, setUsageItems] = useState<UsageMaterialItem[]>([]);
    const [showUsagePicker, setShowUsagePicker] = useState(false);
    const [usageSearch, setUsageSearch] = useState('');
    const [additionalServices, setAdditionalServices] = useState<
        ExtraServiceDraft[]
    >([]);
    const [showServicePicker, setShowServicePicker] = useState(false);
    const [serviceSearch, setServiceSearch] = useState('');
    const [uiError, setUiError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch service recipe for pre-filling usage materials
    const { data: recipeItems } = useQuery<ServiceRecipeItem[]>({
        queryKey: ['service-recipe', appointment?.service?.id],
        queryFn: () =>
            apiFetch<ServiceRecipeItem[]>(
                `/services/${appointment?.service?.id}/recipe`,
            ),
        enabled: open && !!appointment?.service?.id,
    });

    // Authoritative price from the cennik. The appointment object from the
    // calendar carries the service name but not its price, so the suggested
    // price is fetched from /services/:id (falls back to whatever the
    // appointment carries).
    const { data: cennikService } = useQuery<Service>({
        queryKey: ['service-detail', appointment?.service?.id],
        queryFn: () =>
            apiFetch<Service>(`/services/${appointment?.service?.id}`),
        enabled: open && !!appointment?.service?.id,
    });
    const suggestedServicePrice =
        Number(cennikService?.price ?? appointment?.service?.price ?? 0) || 0;

    // Pre-fill the editable price once the cennik price is known; reset on close
    // so a fresh open re-suggests.
    useEffect(() => {
        if (!open) {
            setServicePricePln('');
            setServicePrefilled(false);
            return;
        }
        if (servicePrefilled) return;
        if (suggestedServicePrice > 0) {
            setServicePricePln(suggestedServicePrice.toFixed(2));
            setServicePrefilled(true);
        }
    }, [open, suggestedServicePrice, servicePrefilled]);

    // Client's standing discount (own percent, else from their group) — used
    // to pre-fill the discount field at finalization. Staff can still edit it.
    const clientId = appointment?.client?.id;
    const { data: clientRecord } = useQuery<{
        resolvedDiscountPercent: number | null;
    }>({
        queryKey: ['customer-discount', clientId],
        queryFn: () =>
            apiFetch<{ resolvedDiscountPercent: number | null }>(
                `/customers/${clientId}`,
            ),
        enabled: open && !!clientId,
    });
    const standingDiscountPercent =
        clientRecord?.resolvedDiscountPercent ?? null;
    const [discountPrefilled, setDiscountPrefilled] = useState(false);
    useEffect(() => {
        if (!open) {
            setDiscountPrefilled(false);
            return;
        }
        if (discountPrefilled || discountPln !== '') return;
        if (standingDiscountPercent == null || standingDiscountPercent <= 0)
            return;
        const basePrice =
            parseFloat(servicePricePln) || 0 || suggestedServicePrice;
        if (basePrice <= 0) return;
        const amount = Math.round(basePrice * standingDiscountPercent) / 100;
        setDiscountPln(amount.toFixed(2));
        setDiscountPrefilled(true);
    }, [
        open,
        standingDiscountPercent,
        appointment,
        discountPrefilled,
        discountPln,
        servicePricePln,
        suggestedServicePrice,
    ]);

    // Fetch products for upselling. Pickers only offer active products
    // (filtered server-side); deactivated stock must not be sellable/usable.
    const { data: productsResponse } = useQuery<ProductsResponse>({
        // The products list endpoint filters to active by default
        // (includeInactive=false). It does NOT accept `isActive` — passing it
        // triggers a 400 (forbidNonWhitelisted), which left the picker empty.
        queryKey: ['products', { includeInactive: false }],
        queryFn: () => apiFetch<ProductsResponse>('/products'),
        enabled: open && (showProductPicker || showUsagePicker),
    });
    const products = useMemo<Product[]>(
        () =>
            Array.isArray(productsResponse)
                ? productsResponse
                : (productsResponse?.items ?? []),
        [productsResponse],
    );

    // Active services for the "additional services" picker.
    const { data: servicesResponse } = useQuery<
        Service[] | { items: Service[] }
    >({
        queryKey: ['services', { isActive: true }],
        queryFn: () =>
            apiFetch<Service[] | { items: Service[] }>(
                '/services?isActive=true',
            ),
        enabled: open && showServicePicker,
    });
    const services = useMemo<Service[]>(
        () =>
            Array.isArray(servicesResponse)
                ? servicesResponse
                : (servicesResponse?.items ?? []),
        [servicesResponse],
    );

    // Searchable filtering of the (long) pickers.
    const matchProduct = (p: Product, q: string) =>
        [p.name, p.brand, p.sku, p.barcode].some((f) =>
            String(f ?? '')
                .toLowerCase()
                .includes(q),
        );
    const filteredProducts = useMemo(() => {
        const q = productSearch.trim().toLowerCase();
        return q ? products.filter((p) => matchProduct(p, q)) : products;
    }, [products, productSearch]);
    const filteredUsageProducts = useMemo(() => {
        const q = usageSearch.trim().toLowerCase();
        return q ? products.filter((p) => matchProduct(p, q)) : products;
    }, [products, usageSearch]);
    const filteredServices = useMemo(() => {
        const q = serviceSearch.trim().toLowerCase();
        return q
            ? services.filter((s) =>
                  String(s.name ?? '')
                      .toLowerCase()
                      .includes(q),
              )
            : services;
    }, [services, serviceSearch]);

    // Calculate totals
    const summary = useMemo(() => {
        const servicePrice = parseFloat(servicePricePln) || 0;
        const discount = parseFloat(discountPln) || 0;
        const productsTotal = productSales.reduce((sum, item) => {
            const product = products.find((p) => p.id === item.productId);
            const price = item.unitPriceCents
                ? item.unitPriceCents / 100
                : (product?.unitPrice ?? 0);
            const itemDiscount = item.discountCents
                ? item.discountCents / 100
                : 0;
            return sum + (price * item.quantity - itemDiscount);
        }, 0);
        const additionalServicesTotal = additionalServices.reduce(
            (sum, item) =>
                sum + Math.max(0, item.priceCents - item.discountCents) / 100,
            0,
        );
        // Amount the client owes for the visit.
        const amountDue = Math.max(
            0,
            servicePrice - discount + productsTotal + additionalServicesTotal,
        );
        // What the client actually leaves. Blank field = pays exactly the
        // amount due; anything above it is the tip, anything below is an
        // underpayment (warned, not blocked).
        const paid =
            paidPln.trim() === ''
                ? amountDue
                : Math.max(0, parseFloat(paidPln) || 0);
        const tip = Math.max(0, paid - amountDue);
        const underpaid = Math.max(0, amountDue - paid);

        return {
            servicePrice,
            discount,
            productsTotal,
            additionalServicesTotal,
            amountDue,
            paid,
            tip,
            underpaid,
        };
    }, [
        servicePricePln,
        discountPln,
        paidPln,
        productSales,
        products,
        additionalServices,
    ]);
    const maxDiscount =
        summary.servicePrice +
        summary.productsTotal +
        summary.additionalServicesTotal;
    const isDiscountInvalid = summary.discount > maxDiscount;

    // Finalize mutation
    const finalizeMutation = useMutation({
        mutationFn: async (data: FinalizeAppointmentRequest) => {
            return apiFetch<Appointment>(
                `/appointments/${appointment?.id}/finalize`,
                {
                    method: 'POST',
                    body: JSON.stringify(data),
                },
            );
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: CALENDAR_QUERY_KEY,
            });
            void queryClient.invalidateQueries({
                queryKey: APPOINTMENTS_QUERY_KEY,
            });
            setSuccessMessage('Wizyta została poprawnie sfinalizowana.');
            onSuccess?.();
            closeTimerRef.current = setTimeout(() => {
                handleClose();
            }, 900);
        },
        onError: (error) => {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Wystąpił błąd podczas finalizacji wizyty';
            if (message.toLowerCase().includes('pos is disabled')) {
                setUiError(
                    'Sprzedaż produktów jest wyłączona (POS). Włącz POS_ENABLED=true.',
                );
                return;
            }
            setUiError(message);
        },
    });

    const handleClose = () => {
        if (closeTimerRef.current !== null) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        setPaymentMethod('card');
        setDiscountPln('');
        setPaidPln('');
        setNote('');
        setShowNote(false);
        setClientNote('');
        setShowClientNote(false);
        setFormula('');
        setShowFormula(false);
        setAdditionalServices([]);
        setShowServicePicker(false);
        setServiceSearch('');
        setProductSales([]);
        setUsageMaterials([]);
        setShowProductPicker(false);
        setShowUsagePicker(false);
        setProductSearch('');
        setUsageSearch('');
        setUiError(null);
        setSuccessMessage(null);
        onClose();
    };

    useEffect(
        () => () => {
            if (closeTimerRef.current !== null) {
                clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
            }
        },
        [],
    );

    // Pre-fill usage materials from service recipe when modal opens
    useEffect(() => {
        if (!open || !recipeItems) return;
        const prefilled = recipeItems
            .filter(
                (
                    r,
                ): r is typeof r & {
                    productId: number;
                    product: NonNullable<typeof r.product>;
                    quantity: number;
                } =>
                    r.productId != null &&
                    r.product != null &&
                    r.quantity != null &&
                    r.quantity >= 1,
            )
            .map((r) => ({
                productId: r.productId,
                productName: r.product.name,
                quantity: Math.max(1, Math.round(r.quantity)),
                unit: r.unit ?? r.product?.unit ?? 'op.',
            }));
        setUsageMaterials(prefilled);
    }, [open, recipeItems]);

    const handleSubmit = () => {
        if (!appointment) return;
        if (isDiscountInvalid) {
            setUiError(
                'Rabat nie może być większy niż suma usługi i produktów.',
            );
            return;
        }
        setUiError(null);

        const data: FinalizeAppointmentRequest = {
            paymentMethod,
            servicePriceCents: Math.round(summary.servicePrice * 100),
            paidAmountCents: Math.round(summary.paid * 100),
            tipAmountCents: Math.round(summary.tip * 100),
            discountCents: Math.round(summary.discount * 100),
            products: productSales.length > 0 ? productSales : undefined,
            usageMaterials:
                usageMaterials.length > 0 ? usageMaterials : undefined,
            note: note || undefined,
            clientNote: clientNote || undefined,
            formula: formula.trim() || undefined,
            additionalServices:
                additionalServices.length > 0
                    ? additionalServices.map((s) => ({
                          serviceId: s.serviceId,
                          priceCents: s.priceCents,
                          discountCents: s.discountCents,
                      }))
                    : undefined,
            usageItems:
                usageItems.length > 0
                    ? usageItems.map((item) => ({
                          productId: item.productId,
                          quantity: item.quantity,
                          unit: item.unit,
                      }))
                    : undefined,
        };

        finalizeMutation.mutate(data);
    };

    const addProduct = (productId: number) => {
        const product = products.find((p) => p.id === productId);
        const trackStock = product?.trackStock !== false;
        const availableStock = product?.stock ?? 0;
        const existing = productSales.find((p) => p.productId === productId);
        if (trackStock && existing && existing.quantity >= availableStock) {
            setUiError(
                `Maksymalna ilość dla ${product?.name ?? 'produktu'} to ${availableStock}.`,
            );
            return;
        }
        if (trackStock && !existing && availableStock <= 0) {
            setUiError(
                `Produkt ${product?.name ?? 'jest niedostępny'} (stan: 0).`,
            );
            return;
        }
        setUiError(null);
        if (existing) {
            setProductSales(
                productSales.map((p) =>
                    p.productId === productId
                        ? { ...p, quantity: p.quantity + 1 }
                        : p,
                ),
            );
        } else {
            setProductSales([...productSales, { productId, quantity: 1 }]);
        }
    };

    const removeProduct = (productId: number) => {
        setProductSales(productSales.filter((p) => p.productId !== productId));
    };

    const addAdditionalService = (serviceId: number) => {
        const svc = services.find((s) => s.id === serviceId);
        if (!svc) return;
        setAdditionalServices((prev) => [
            ...prev,
            {
                serviceId: svc.id,
                name: svc.name,
                priceCents: Math.round(Number(svc.price ?? 0) * 100),
                discountCents: 0,
            },
        ]);
        setShowServicePicker(false);
    };

    const updateAdditionalServicePrice = (index: number, pln: string) => {
        const priceCents = Math.max(
            0,
            Math.round((parseFloat(pln) || 0) * 100),
        );
        setAdditionalServices((prev) =>
            prev.map((s, i) => (i === index ? { ...s, priceCents } : s)),
        );
    };

    const removeAdditionalService = (index: number) => {
        setAdditionalServices((prev) => prev.filter((_, i) => i !== index));
    };

    const addUsageMaterial = (productId: number) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;
        const existing = usageItems.find((u) => u.productId === productId);
        if (existing) return;
        setUsageItems((prev) => [
            ...prev,
            {
                productId,
                productName: product.name,
                quantity: 1,
                unit: 'op.',
            },
        ]);
        setShowUsagePicker(false);
    };

    const updateProductQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeProduct(productId);
        } else {
            const product = products.find((p) => p.id === productId);
            const trackStock = product?.trackStock !== false;
            const availableStock = product?.stock ?? 0;
            if (trackStock && quantity > availableStock) {
                setUiError(
                    `Maksymalna ilość dla ${product?.name ?? 'produktu'} to ${availableStock}.`,
                );
                return;
            }
            setUiError(null);
            setProductSales(
                productSales.map((p) =>
                    p.productId === productId ? { ...p, quantity } : p,
                ),
            );
        }
    };

    const updateUsageMaterialQuantity = (
        productId: number,
        quantity: number,
    ) => {
        if (quantity <= 0) {
            setUsageMaterials((prev) =>
                prev.filter((m) => m.productId !== productId),
            );
        } else {
            setUsageMaterials((prev) =>
                prev.map((m) =>
                    m.productId === productId ? { ...m, quantity } : m,
                ),
            );
        }
    };

    const removeUsageMaterial = (productId: number) => {
        setUsageMaterials((prev) =>
            prev.filter((m) => m.productId !== productId),
        );
    };

    if (!appointment) return null;

    return (
        <Modal open={open} onClose={handleClose}>
            <div
                className="w-100"
                style={{
                    width: 'min(860px, 92vw)',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                }}
            >
                <h2 className="fs-5 fw-semibold mb-3">Finalizacja wizyty</h2>

                {/* Client & Service Info */}
                <div className="bg-light rounded-3 p-2 mb-3">
                    <div className="small text-muted">
                        <span className="fw-medium">
                            {appointment.client?.name}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{appointment.service?.name}</span>
                    </div>
                    <div className="mt-2">
                        <label
                            htmlFor="fin-service-price"
                            className="d-block small fw-medium text-body mb-1"
                        >
                            Cena usługi (PLN)
                            {suggestedServicePrice > 0 && (
                                <span className="ms-2 fw-normal text-muted">
                                    · z cennika{' '}
                                    {suggestedServicePrice.toFixed(2)} zł
                                </span>
                            )}
                        </label>
                        <input
                            id="fin-service-price"
                            type="number"
                            min={0}
                            step="0.01"
                            inputMode="decimal"
                            className="form-control"
                            placeholder="0.00"
                            value={servicePricePln}
                            onChange={(e) => setServicePricePln(e.target.value)}
                        />
                    </div>
                </div>

                {/* Payment Method */}
                <div className="mb-4">
                    <span className="d-block small fw-medium text-body mb-2">
                        Metoda płatności
                    </span>
                    <div
                        className="d-grid gap-2"
                        style={{
                            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                        }}
                    >
                        {PAYMENT_METHODS.map((method) => {
                            const active = paymentMethod === method.value;
                            return (
                                <button
                                    key={method.value}
                                    type="button"
                                    onClick={() =>
                                        setPaymentMethod(method.value)
                                    }
                                    className="d-flex flex-column align-items-center justify-content-center gap-1 rounded-3 border"
                                    style={{
                                        padding: '0.75rem 0.5rem',
                                        borderColor: active
                                            ? '#0d0d0d'
                                            : '#e2e4e7',
                                        borderWidth: active ? 2 : 1,
                                        background: active
                                            ? '#0d0d0d'
                                            : '#ffffff',
                                        color: active ? '#ffffff' : '#1a1a1a',
                                        transition:
                                            'background 0.12s, border-color 0.12s',
                                    }}
                                >
                                    <method.Icon
                                        aria-hidden="true"
                                        style={{ width: 22, height: 22 }}
                                    />
                                    <span style={{ fontSize: '0.78rem' }}>
                                        {method.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Discount */}
                <div className="mb-3">
                    <label
                        htmlFor="fin-discount"
                        className="d-block small fw-medium text-body mb-1"
                    >
                        Rabat (PLN)
                        {standingDiscountPercent != null &&
                            standingDiscountPercent > 0 && (
                                <span className="ms-2 fw-normal text-muted">
                                    · rabat stały klientki{' '}
                                    {standingDiscountPercent}%
                                </span>
                            )}
                    </label>
                    <input
                        id="fin-discount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountPln}
                        onChange={(e) => setDiscountPln(e.target.value)}
                        className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-2"
                        placeholder="0.00"
                    />
                    {isDiscountInvalid && (
                        <div className="small text-danger mt-1">
                            Maksymalny rabat dla tej finalizacji to{' '}
                            {maxDiscount.toFixed(2)} PLN.
                        </div>
                    )}
                </div>

                {/* Usage Materials (from service recipe) */}
                {usageMaterials.length > 0 && (
                    <div className="mb-3">
                        <span className="d-block small fw-medium text-body mb-2">
                            Materiały do zabiegu
                        </span>
                        <div className="d-flex flex-column gap-2">
                            {usageMaterials.map((material) => (
                                <div
                                    key={material.productId}
                                    className="d-flex align-items-center justify-content-between bg-light rounded px-2 py-1"
                                >
                                    <div className="small">
                                        <span>{material.productName}</span>
                                        {material.unit && (
                                            <span className="text-muted ms-1">
                                                ({material.unit})
                                            </span>
                                        )}
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateUsageMaterialQuantity(
                                                    material.productId,
                                                    material.quantity - 1,
                                                )
                                            }
                                            className="d-flex align-items-center justify-content-center rounded border"
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                            }}
                                        >
                                            -
                                        </button>
                                        <span
                                            className="text-center small"
                                            style={{ width: '24px' }}
                                        >
                                            {material.quantity}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateUsageMaterialQuantity(
                                                    material.productId,
                                                    material.quantity + 1,
                                                )
                                            }
                                            className="d-flex align-items-center justify-content-center rounded border"
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                            }}
                                        >
                                            +
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeUsageMaterial(
                                                    material.productId,
                                                )
                                            }
                                            className="text-danger ms-1"
                                            aria-label="Usuń materiał do zabiegu"
                                        >
                                            <span aria-hidden="true">×</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Additional services */}
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="d-block small fw-medium text-body">
                            Dodatkowe usługi
                        </span>
                        <button
                            type="button"
                            onClick={() =>
                                setShowServicePicker(!showServicePicker)
                            }
                            className="small text-primary"
                        >
                            {showServicePicker ? 'Ukryj' : '+ Dodaj usługę'}
                        </button>
                    </div>

                    {showServicePicker && (
                        <div className="border border-secondary border-opacity-25 rounded-3 p-2 mb-2">
                            <PickerSearch
                                value={serviceSearch}
                                onChange={setServiceSearch}
                                placeholder="Szukaj usługi…"
                            />
                            <div
                                className="overflow-y-auto"
                                style={{ maxHeight: '220px' }}
                            >
                                {services.length === 0 ? (
                                    <p className="small text-muted mb-0">
                                        Ładowanie usług…
                                    </p>
                                ) : filteredServices.length === 0 ? (
                                    <p className="small text-muted mb-0">
                                        Brak usług dla „{serviceSearch}”.
                                    </p>
                                ) : (
                                    filteredServices.map((svc) => (
                                        <button
                                            type="button"
                                            key={svc.id}
                                            onClick={() =>
                                                addAdditionalService(svc.id)
                                            }
                                            className="d-flex justify-content-between w-100 border-0 bg-transparent px-1 py-1 small text-start"
                                        >
                                            <span>{svc.name}</span>
                                            <span className="text-muted">
                                                {Number(svc.price ?? 0).toFixed(
                                                    2,
                                                )}{' '}
                                                zł
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {additionalServices.length > 0 && (
                        <ul className="list-unstyled mb-0">
                            {additionalServices.map((s, index) => (
                                <li
                                    key={`${s.serviceId}-${index}`}
                                    className="d-flex align-items-center gap-2 small mb-1"
                                >
                                    <span className="flex-grow-1">
                                        {s.name}
                                    </span>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        inputMode="decimal"
                                        aria-label={`Cena dla ${s.name}`}
                                        placeholder="cena zł"
                                        value={s.priceCents / 100}
                                        onChange={(e) =>
                                            updateAdditionalServicePrice(
                                                index,
                                                e.target.value,
                                            )
                                        }
                                        className="form-control form-control-sm"
                                        style={{ width: '100px' }}
                                    />
                                    <span className="text-muted">zł</span>
                                    <button
                                        type="button"
                                        aria-label={`Usuń ${s.name}`}
                                        onClick={() =>
                                            removeAdditionalService(index)
                                        }
                                        className="btn btn-sm btn-link text-danger p-0"
                                    >
                                        ✕
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Product Upselling */}
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="d-block small fw-medium text-body">
                            Sprzedaż produktów
                        </span>
                        <button
                            type="button"
                            onClick={() =>
                                setShowProductPicker(!showProductPicker)
                            }
                            className="small text-primary"
                        >
                            {showProductPicker ? 'Ukryj' : '+ Dodaj produkt'}
                        </button>
                    </div>

                    {showProductPicker && (
                        <div className="border border-secondary border-opacity-25 rounded-3 p-2 mb-2">
                            <PickerSearch
                                value={productSearch}
                                onChange={setProductSearch}
                                placeholder="Szukaj produktu (nazwa, marka, SKU)…"
                            />
                            <div
                                className="overflow-y-auto"
                                style={{ maxHeight: '220px' }}
                            >
                                {products.length === 0 ? (
                                    <p className="small text-muted text-center py-2">
                                        Brak produktów
                                    </p>
                                ) : filteredProducts.length === 0 ? (
                                    <p className="small text-muted text-center py-2">
                                        Brak produktów dla „{productSearch}”.
                                    </p>
                                ) : (
                                    <div className="d-flex flex-column gap-1">
                                        {filteredProducts.map((product) => (
                                            <button
                                                key={product.id}
                                                type="button"
                                                onClick={() =>
                                                    addProduct(product.id)
                                                }
                                                className="w-100 text-start px-2 py-1 small rounded d-flex justify-content-between"
                                            >
                                                <span>
                                                    {product.name}
                                                    <span className="text-muted ms-2">
                                                        stan: {product.stock}
                                                    </span>
                                                </span>
                                                <span className="text-muted">
                                                    {product.unitPrice.toFixed(
                                                        2,
                                                    )}{' '}
                                                    PLN
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {productSales.length > 0 && (
                        <div className="d-flex flex-column gap-2">
                            {productSales.map((sale) => {
                                const product = products.find(
                                    (p) => p.id === sale.productId,
                                );
                                const unitPrice =
                                    sale.unitPriceCents !== undefined
                                        ? sale.unitPriceCents / 100
                                        : (product?.unitPrice ?? 0);
                                const lineTotal = unitPrice * sale.quantity;
                                return (
                                    <div
                                        key={sale.productId}
                                        className="d-flex align-items-center justify-content-between bg-light rounded px-2 py-1"
                                    >
                                        <div className="small">
                                            <div>{product?.name}</div>
                                            <div className="text-muted">
                                                {unitPrice.toFixed(2)} PLN x{' '}
                                                {sale.quantity} ={' '}
                                                {lineTotal.toFixed(2)} PLN
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateProductQuantity(
                                                        sale.productId,
                                                        sale.quantity - 1,
                                                    )
                                                }
                                                className="d-flex align-items-center justify-content-center rounded border"
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                }}
                                            >
                                                -
                                            </button>
                                            <span
                                                className="text-center small"
                                                style={{ width: '24px' }}
                                            >
                                                {sale.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateProductQuantity(
                                                        sale.productId,
                                                        sale.quantity + 1,
                                                    )
                                                }
                                                className="d-flex align-items-center justify-content-center rounded border"
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                }}
                                            >
                                                +
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeProduct(
                                                        sale.productId,
                                                    )
                                                }
                                                className="text-danger ms-1"
                                                aria-label="Usuń produkt ze sprzedaży"
                                            >
                                                <span aria-hidden="true">
                                                    ×
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Materials used */}
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small fw-medium text-body mb-0">
                            Użyte materiały
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowUsagePicker(!showUsagePicker)}
                            className="small text-primary"
                        >
                            {showUsagePicker ? 'Ukryj' : '+ Dodaj materiał'}
                        </button>
                    </div>

                    {showUsagePicker && (
                        <div className="border border-secondary border-opacity-25 rounded-3 p-2 mb-2">
                            <PickerSearch
                                value={usageSearch}
                                onChange={setUsageSearch}
                                placeholder="Szukaj materiału (nazwa, marka, SKU)…"
                            />
                            <div
                                className="overflow-y-auto"
                                style={{ maxHeight: '200px' }}
                            >
                                {(() => {
                                    const available =
                                        filteredUsageProducts.filter(
                                            (p) =>
                                                !usageItems.some(
                                                    (u) => u.productId === p.id,
                                                ),
                                        );
                                    if (products.length === 0) {
                                        return (
                                            <p className="small text-muted text-center py-2">
                                                Brak produktów
                                            </p>
                                        );
                                    }
                                    if (available.length === 0) {
                                        return (
                                            <p className="small text-muted text-center py-2">
                                                {usageSearch
                                                    ? `Brak materiałów dla „${usageSearch}”.`
                                                    : 'Brak materiałów.'}
                                            </p>
                                        );
                                    }
                                    return (
                                        <div className="d-flex flex-column gap-1">
                                            {available.map((product) => (
                                                <button
                                                    key={product.id}
                                                    type="button"
                                                    onClick={() =>
                                                        addUsageMaterial(
                                                            product.id,
                                                        )
                                                    }
                                                    className="w-100 text-start px-2 py-1 small rounded d-flex justify-content-between"
                                                >
                                                    <span>{product.name}</span>
                                                    <span className="text-muted">
                                                        stan:{' '}
                                                        {product.stock ?? '–'}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {usageItems.length > 0 && (
                        <div>
                            <div className="d-flex flex-column gap-2">
                                {usageItems.map((item, idx) => (
                                    <div
                                        key={item.productId}
                                        className="d-flex align-items-center gap-2 bg-light rounded px-2 py-1"
                                    >
                                        <span className="flex-fill small">
                                            {item.productName}
                                        </span>
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={item.quantity}
                                            onChange={(e) => {
                                                const qty =
                                                    parseInt(e.target.value) ||
                                                    1;
                                                setUsageItems((prev) =>
                                                    prev.map((it, i) =>
                                                        i === idx
                                                            ? {
                                                                  ...it,
                                                                  quantity:
                                                                      Math.max(
                                                                          1,
                                                                          qty,
                                                                      ),
                                                              }
                                                            : it,
                                                    ),
                                                );
                                            }}
                                            className="form-control form-control-sm"
                                            style={{ width: '70px' }}
                                        />
                                        <span className="small text-muted">
                                            {item.unit}
                                        </span>
                                        <button
                                            type="button"
                                            className="text-danger small"
                                            aria-label="Usuń użyty materiał"
                                            onClick={() =>
                                                setUsageItems((prev) =>
                                                    prev.filter(
                                                        (_, i) => i !== idx,
                                                    ),
                                                )
                                            }
                                        >
                                            <span aria-hidden="true">×</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Internal note (staff-only) — optional, expand/collapse */}
                <CollapsibleField
                    open={showNote}
                    onToggle={() => setShowNote((v) => !v)}
                    addLabel="+ Dodaj notatkę wewnętrzną"
                    label="Notatka wewnętrzna (tylko personel)"
                    htmlFor="fin-note"
                >
                    <textarea
                        id="fin-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-2"
                        rows={2}
                        placeholder="Stan włosów, proporcje farb, uwagi dla zespołu..."
                    />
                </CollapsibleField>

                {/* Client-visible recommendations — optional, expand/collapse */}
                <CollapsibleField
                    open={showClientNote}
                    onToggle={() => setShowClientNote((v) => !v)}
                    addLabel="+ Dodaj zalecenia dla klienta"
                    label="Zalecenia dla klienta (widoczne dla klienta)"
                    htmlFor="fin-client-note"
                >
                    <textarea
                        id="fin-client-note"
                        value={clientNote}
                        onChange={(e) => setClientNote(e.target.value)}
                        className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-2"
                        rows={2}
                        maxLength={1000}
                        placeholder="Np. pielęgnacja w domu, kiedy umyć włosy, polecane produkty..."
                    />
                </CollapsibleField>

                {/* Treatment formula — optional, expand/collapse */}
                <CollapsibleField
                    open={showFormula}
                    onToggle={() => setShowFormula((v) => !v)}
                    addLabel="+ Dodaj recepturę / formułę koloru"
                    label="Receptura / formuła koloru (opcjonalna)"
                    htmlFor="fin-formula"
                >
                    <textarea
                        id="fin-formula"
                        value={formula}
                        onChange={(e) => setFormula(e.target.value)}
                        className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-2"
                        rows={2}
                        maxLength={1000}
                        placeholder="Np. kolor 7.1 + 8 vol, 40 min..."
                    />
                    <div className="form-text">
                        Zapisze się w historii klienta razem z wizytą.
                    </div>
                </CollapsibleField>

                {/* Summary */}
                <div className="bg-light rounded-3 p-2 mb-3">
                    <div className="d-flex flex-column gap-1 small">
                        <div className="d-flex justify-content-between">
                            <span>Usługa:</span>
                            <span>{summary.servicePrice.toFixed(2)} PLN</span>
                        </div>
                        {summary.additionalServicesTotal > 0 && (
                            <div className="d-flex justify-content-between">
                                <span>Dodatkowe usługi:</span>
                                <span>
                                    {summary.additionalServicesTotal.toFixed(2)}{' '}
                                    PLN
                                </span>
                            </div>
                        )}
                        {summary.productsTotal > 0 && (
                            <div className="d-flex justify-content-between">
                                <span>Produkty:</span>
                                <span>
                                    {summary.productsTotal.toFixed(2)} PLN
                                </span>
                            </div>
                        )}
                        {summary.discount > 0 && (
                            <div className="d-flex justify-content-between text-success">
                                <span>Rabat:</span>
                                <span>-{summary.discount.toFixed(2)} PLN</span>
                            </div>
                        )}
                        <div className="border-top pt-1 mt-1">
                            <div className="d-flex justify-content-between fw-semibold fs-5">
                                <span>Do zapłaty:</span>
                                <span>{summary.amountDue.toFixed(2)} PLN</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Amount paid → tip is the surplus over the amount due */}
                <div className="mb-3">
                    <label
                        htmlFor="fin-paid"
                        className="d-block small fw-medium text-body mb-1"
                    >
                        Kwota zapłacona (PLN)
                    </label>
                    <input
                        id="fin-paid"
                        type="number"
                        min="0"
                        step="0.01"
                        value={paidPln}
                        onChange={(e) => setPaidPln(e.target.value)}
                        className="w-100 px-3 py-2 border border-secondary border-opacity-50 rounded-2"
                        placeholder={summary.amountDue.toFixed(2)}
                    />
                    {summary.tip > 0 && (
                        <div
                            className="small mt-1 d-flex justify-content-between"
                            role="status"
                        >
                            <span className="text-muted">
                                → Napiwek (nadwyżka):
                            </span>
                            <span className="fw-medium">
                                +{summary.tip.toFixed(2)} PLN
                            </span>
                        </div>
                    )}
                    {summary.underpaid > 0 && (
                        <div className="small text-danger mt-1" role="alert">
                            ⚠ Niedopłata — brakuje{' '}
                            {summary.underpaid.toFixed(2)} PLN do kwoty
                            należnej.
                        </div>
                    )}
                    <div className="form-text">
                        Zostaw puste, jeśli klient płaci dokładnie. Nadwyżka
                        jest liczona jako napiwek.
                    </div>
                </div>

                {/* Error */}
                {(finalizeMutation.isError || uiError) && (
                    <div className="bg-danger bg-opacity-10 text-danger p-2 rounded mb-3 small">
                        {uiError ?? 'Wystąpił błąd podczas finalizacji wizyty'}
                    </div>
                )}
                {successMessage && (
                    <div className="bg-success bg-opacity-10 text-success p-2 rounded mb-3 small">
                        {successMessage}
                    </div>
                )}

                {/* Actions */}
                <div className="d-flex gap-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-fill px-3 py-2 border border-secondary border-opacity-50 rounded-2"
                    >
                        Anuluj
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={
                            finalizeMutation.isPending || isDiscountInvalid
                        }
                        className="flex-fill btn btn-success"
                    >
                        {finalizeMutation.isPending
                            ? 'Zapisywanie...'
                            : 'Zakończ wizytę'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
type ProductsResponse =
    | Product[]
    | {
          items?: Product[];
      };
