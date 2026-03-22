'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import VersumBreadcrumbs from '@/components/salonbw/VersumBreadcrumbs';
import ManageCategoriesModal from '@/components/services/ManageCategoriesModal';
import { useAuth } from '@/contexts/AuthContext';
import {
    useCreateService,
    useServiceCategories,
    useUploadServicePhoto,
    useUpdateServiceRecipe,
} from '@/hooks/useServicesAdmin';
import { useWarehouseProducts } from '@/hooks/useWarehouseViews';
import type { PriceType, ServiceCategory } from '@/types';

type MeasureKind = 'single' | 'single_with_range' | 'multiple';
type OnlineBookingMode = 'online_booking_enabled' | 'online_booking_hidden';
type VatCode = '23' | '8' | '5' | '0' | 'zw';

type VariantDraft = {
    key: number;
    name: string;
    duration: string;
    price: string;
};

type RecipeDraft = {
    key: number;
    productId: number | null;
    productName: string;
    unit: string;
    quantity: string;
};

const VAT_OPTIONS: Array<{ code: VatCode; label: string; value?: number }> = [
    { code: '23', label: '23%', value: 23 },
    { code: '8', label: '8%', value: 8 },
    { code: '5', label: '5%', value: 5 },
    { code: '0', label: '0%', value: 0 },
    { code: 'zw', label: 'zwolniony' },
];

function flattenCategories(
    nodes: ServiceCategory[],
    depth = 0,
): Array<{ id: number; name: string; depth: number }> {
    const result: Array<{ id: number; name: string; depth: number }> = [];

    for (const node of nodes) {
        result.push({ id: node.id, name: node.name, depth });
        if (node.children?.length) {
            result.push(...flattenCategories(node.children, depth + 1));
        }
    }

    return result;
}

function createVariantDraft(key: number): VariantDraft {
    return { key, name: '', duration: '', price: '' };
}

function createRecipeDraft(key: number): RecipeDraft {
    return { key, productId: null, productName: '', unit: '', quantity: '' };
}

function formatCategoryLabel(name: string, depth: number) {
    return `${'\u00A0'.repeat(depth * 4)}${name}`;
}

export default function NewServicePage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:services">
            <SalonBWShell role={role}>
                <NewServicePageContent />
            </SalonBWShell>
        </RouteGuard>
    );
}

function NewServicePageContent() {
    const router = useRouter();
    const { data: categories = [] } = useServiceCategories();
    const createService = useCreateService();
    const uploadServicePhoto = useUploadServicePhoto();
    const updateServiceRecipe = useUpdateServiceRecipe();

    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState<string>(
        typeof router.query.categoryId === 'string'
            ? router.query.categoryId
            : '',
    );
    const [duration, setDuration] = useState('60');
    const [price, setPrice] = useState('0');
    const [priceMax, setPriceMax] = useState('');
    const [measureKind, setMeasureKind] = useState<MeasureKind>('single');
    const [showMeasureKindBox, setShowMeasureKindBox] = useState(false);
    const [showDurationModal, setShowDurationModal] = useState(false);
    const [showAdvancedSection, setShowAdvancedSection] = useState(false);
    const [showRecipeTable, setShowRecipeTable] = useState(false);
    const [durationBefore, setDurationBefore] = useState('');
    const [hasDurationBefore, setHasDurationBefore] = useState(false);
    const [durationAfter, setDurationAfter] = useState('');
    const [hasDurationAfter, setHasDurationAfter] = useState(false);
    const [breakOffset, setBreakOffset] = useState('');
    const [breakDuration, setBreakDuration] = useState('');
    const [hasBreak, setHasBreak] = useState(false);
    const [vatCode, setVatCode] = useState<VatCode>('23');
    const [publicDescription, setPublicDescription] = useState('');
    const [privateDescription, setPrivateDescription] = useState('');
    const [onlineBookingMode, setOnlineBookingMode] =
        useState<OnlineBookingMode>('online_booking_enabled');
    const [variants, setVariants] = useState<VariantDraft[]>([
        createVariantDraft(1),
        createVariantDraft(2),
    ]);
    const [nextVariantKey, setNextVariantKey] = useState(3);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [recipeItems, setRecipeItems] = useState<RecipeDraft[]>([
        createRecipeDraft(1),
    ]);
    const [nextRecipeKey, setNextRecipeKey] = useState(2);
    const [activeRecipeRowKey, setActiveRecipeRowKey] = useState<number | null>(
        null,
    );
    const [recipeProductSearch, setRecipeProductSearch] = useState('');
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const categoryOptions = useMemo(
        () => flattenCategories(categories),
        [categories],
    );

    const activeVatRate = VAT_OPTIONS.find(
        (option) => option.code === vatCode,
    )?.value;

    const { data: recipeProducts = [] } = useWarehouseProducts({
        search: activeRecipeRowKey !== null ? recipeProductSearch : undefined,
    });

    const recipeSuggestions = useMemo(() => {
        if (activeRecipeRowKey === null || !recipeProductSearch.trim()) {
            return [];
        }
        return recipeProducts.slice(0, 8);
    }, [activeRecipeRowKey, recipeProductSearch, recipeProducts]);

    const validVariants = useMemo(() => {
        return variants
            .map((variant) => ({
                name: variant.name.trim(),
                duration: Number(variant.duration),
                price: Number(variant.price),
            }))
            .filter(
                (variant) =>
                    variant.name &&
                    Number.isFinite(variant.duration) &&
                    variant.duration >= 5 &&
                    Number.isFinite(variant.price) &&
                    variant.price >= 0,
            );
    }, [variants]);

    const recipeItemsForSave = useMemo(() => {
        return recipeItems
            .filter((item) => item.productId && Number(item.quantity) > 0)
            .map((item) => ({
                productId: item.productId,
                quantity: Number(item.quantity),
                unit: item.unit.trim() || null,
            }));
    }, [recipeItems]);

    const baseDuration =
        measureKind === 'multiple'
            ? Math.min(...validVariants.map((variant) => variant.duration))
            : Number(duration);

    const basePrice =
        measureKind === 'multiple'
            ? Math.min(...validVariants.map((variant) => variant.price))
            : Number(price);

    const updateVariant = (
        key: number,
        field: keyof Omit<VariantDraft, 'key'>,
        value: string,
    ) => {
        setVariants((current) =>
            current.map((variant) =>
                variant.key === key ? { ...variant, [field]: value } : variant,
            ),
        );
    };

    const addVariant = () => {
        setVariants((current) => [
            ...current,
            createVariantDraft(nextVariantKey),
        ]);
        setNextVariantKey((current) => current + 1);
    };

    const updateRecipeItem = (
        key: number,
        field: keyof Omit<RecipeDraft, 'key'>,
        value: string | number | null,
    ) => {
        setRecipeItems((current) =>
            current.map((item) =>
                item.key === key ? { ...item, [field]: value } : item,
            ),
        );
    };

    const addRecipeItem = () => {
        setRecipeItems((current) => [
            ...current,
            createRecipeDraft(nextRecipeKey),
        ]);
        setNextRecipeKey((current) => current + 1);
    };

    const removeRecipeItem = (key: number) => {
        setRecipeItems((current) => {
            if (current.length <= 1) {
                return [createRecipeDraft(key)];
            }
            return current.filter((item) => item.key !== key);
        });
        if (activeRecipeRowKey === key) {
            setActiveRecipeRowKey(null);
            setRecipeProductSearch('');
        }
    };

    const removeVariant = (key: number) => {
        setVariants((current) => {
            if (current.length <= 2) return current;
            return current.filter((variant) => variant.key !== key);
        });
    };

    const resetForm = () => {
        setName('');
        setCategoryId('');
        setDuration('60');
        setPrice('0');
        setPriceMax('');
        setMeasureKind('single');
        setShowMeasureKindBox(false);
        setShowDurationModal(false);
        setShowAdvancedSection(false);
        setShowRecipeTable(false);
        setDurationBefore('');
        setHasDurationBefore(false);
        setDurationAfter('');
        setHasDurationAfter(false);
        setBreakOffset('');
        setBreakDuration('');
        setHasBreak(false);
        setVatCode('23');
        setPublicDescription('');
        setPrivateDescription('');
        setOnlineBookingMode('online_booking_enabled');
        setVariants([createVariantDraft(1), createVariantDraft(2)]);
        setNextVariantKey(3);
        setSelectedFiles([]);
        setRecipeItems([createRecipeDraft(1)]);
        setNextRecipeKey(2);
        setActiveRecipeRowKey(null);
        setRecipeProductSearch('');
    };

    const validate = () => {
        if (!name.trim()) return 'Pole Nazwa jest wymagane.';

        if (measureKind === 'multiple') {
            if (validVariants.length < 2) {
                return 'Usługa z opcją wiele wariantów musi posiadać co najmniej dwa kompletne warianty.';
            }
            return null;
        }

        if (!Number.isFinite(Number(duration)) || Number(duration) < 5) {
            return 'Czas trwania musi wynosić co najmniej 5 minut.';
        }

        if (!Number.isFinite(Number(price)) || Number(price) < 0) {
            return 'Cena nie może być ujemna.';
        }

        if (
            measureKind === 'single_with_range' &&
            priceMax &&
            Number(priceMax) < Number(price)
        ) {
            return 'Cena maksymalna nie może być niższa niż cena minimalna.';
        }

        if (
            hasDurationBefore &&
            (!Number.isFinite(Number(durationBefore)) ||
                Number(durationBefore) < 0)
        ) {
            return 'Blokada czasu przed usługą musi mieć poprawną wartość.';
        }

        if (
            hasDurationAfter &&
            (!Number.isFinite(Number(durationAfter)) ||
                Number(durationAfter) < 0)
        ) {
            return 'Blokada czasu po usłudze musi mieć poprawną wartość.';
        }

        if (
            hasBreak &&
            (!Number.isFinite(Number(breakOffset)) ||
                Number(breakOffset) < 0 ||
                !Number.isFinite(Number(breakDuration)) ||
                Number(breakDuration) < 0)
        ) {
            return 'Przerwa w usłudze musi mieć poprawny offset i czas trwania.';
        }

        const invalidRecipeItem = recipeItems.find(
            (item) =>
                (item.productName.trim() && !item.productId) ||
                (item.productId &&
                    (!Number.isFinite(Number(item.quantity)) ||
                        Number(item.quantity) <= 0)),
        );

        if (
            invalidRecipeItem?.productName.trim() &&
            !invalidRecipeItem.productId
        ) {
            return 'W recepturze wybierz produkt z listy podpowiedzi.';
        }

        if (invalidRecipeItem?.productId) {
            return 'Każda pozycja receptury musi mieć ilość większą od zera.';
        }

        return null;
    };

    const handleSubmit = async (mode: 'save' | 'save_and_add_another') => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            setNotice(null);
            return;
        }

        setIsSaving(true);
        setError(null);
        setNotice(null);

        try {
            const normalizedDurationBefore = hasDurationBefore
                ? Number(durationBefore) || 0
                : 0;
            const normalizedDurationAfter = hasDurationAfter
                ? Number(durationAfter) || 0
                : 0;
            const normalizedBreakOffset = hasBreak
                ? Number(breakOffset) || 0
                : 0;
            const normalizedBreakDuration = hasBreak
                ? Number(breakDuration) || 0
                : 0;

            const createdService = await createService.mutateAsync({
                name: name.trim(),
                description: publicDescription.trim() || undefined,
                publicDescription: publicDescription.trim() || undefined,
                privateDescription: privateDescription.trim() || undefined,
                duration: baseDuration,
                price: basePrice,
                priceType:
                    measureKind === 'single_with_range'
                        ? ('from' satisfies PriceType)
                        : ('fixed' satisfies PriceType),
                vatRate: activeVatRate,
                durationBefore: normalizedDurationBefore,
                durationAfter: normalizedDurationAfter,
                breakOffset: normalizedBreakOffset,
                breakDuration: normalizedBreakDuration,
                categoryId: categoryId ? Number(categoryId) : undefined,
                onlineBooking: onlineBookingMode === 'online_booking_enabled',
                variants:
                    measureKind === 'multiple'
                        ? validVariants.map((v) => ({
                              name: v.name,
                              duration: v.duration,
                              price: v.price,
                              priceType: 'fixed' as PriceType,
                          }))
                        : undefined,
            });

            let recipeSaveFailed = false;
            if (recipeItemsForSave.length > 0) {
                try {
                    await updateServiceRecipe.mutateAsync({
                        serviceId: createdService.id,
                        items: recipeItemsForSave,
                    });
                } catch (recipeError) {
                    recipeSaveFailed = true;
                    console.error(
                        'Failed to save service recipe:',
                        recipeError,
                    );
                }
            }

            let photoUploadFailed = false;
            if (selectedFiles.length > 0) {
                for (const [index, file] of selectedFiles.entries()) {
                    try {
                        await uploadServicePhoto.mutateAsync({
                            serviceId: createdService.id,
                            file,
                            sortOrder: index,
                            isPublic: true,
                        });
                    } catch (photoError) {
                        photoUploadFailed = true;
                        console.error(
                            'Failed to upload service photo:',
                            photoError,
                        );
                    }
                }
            }

            if (mode === 'save_and_add_another') {
                resetForm();
                const warnings = [
                    recipeSaveFailed ? 'nie udało się zapisać receptury' : null,
                    photoUploadFailed
                        ? 'nie udało się wysłać wszystkich zdjęć'
                        : null,
                ].filter(Boolean);
                setNotice(
                    warnings.length > 0
                        ? `Usługa została zapisana, ale ${warnings.join(', ')}.`
                        : 'Usługa została zapisana. Możesz dodać kolejną.',
                );
                return;
            }

            if (recipeSaveFailed || photoUploadFailed) {
                const warnings = [
                    recipeSaveFailed ? 'receptura' : null,
                    photoUploadFailed ? 'zdjęcia' : null,
                ].filter(Boolean);
                window.alert(
                    `Usługa została zapisana, ale create-flow nie domknął jeszcze: ${warnings.join(', ')}.`,
                );
            }

            await router.push(`/services/${createdService.id}`);
        } catch (submitError) {
            console.error('Failed to create service:', submitError);
            setError(
                'Nie udało się zapisać usługi. Sprawdź dane i spróbuj ponownie.',
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="salonbw-page services-create-page">
            <VersumBreadcrumbs
                iconClass="sprite-breadcrumbs_services"
                items={[
                    { label: 'Usługi', href: '/services' },
                    { label: 'Dodawanie' },
                ]}
            />

            {error ? (
                <div className="services-create-alert services-create-alert--error">
                    {error}
                </div>
            ) : null}

            {notice ? (
                <div className="services-create-alert services-create-alert--success">
                    {notice}
                </div>
            ) : null}

            <form
                className="services-create-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    void handleSubmit('save');
                }}
            >
                <fieldset>
                    <ol className="services-create-fields">
                        <li className="services-create-field">
                            <label htmlFor="service_name">Nazwa</label>
                            <div className="services-create-control">
                                <input
                                    id="service_name"
                                    className="form-control"
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                />
                                <p className="services-create-help">
                                    Nazwa powinna jednoznacznie identyfikować
                                    usługę.
                                </p>
                            </div>
                        </li>

                        <li className="services-create-field">
                            <label htmlFor="service_category">Kategoria</label>
                            <div className="services-create-control services-create-inline">
                                <select
                                    id="service_category"
                                    className="salonbw-select services-create-select"
                                    value={categoryId}
                                    onChange={(event) =>
                                        setCategoryId(event.target.value)
                                    }
                                >
                                    <option value="">wybierz kategorię</option>
                                    {categoryOptions.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {formatCategoryLabel(
                                                category.name,
                                                category.depth,
                                            )}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="button button-link"
                                    onClick={() => setIsCategoriesOpen(true)}
                                >
                                    Dodaj kategorię
                                </button>
                            </div>
                        </li>

                        <li className="services-create-field">
                            <label htmlFor="service_duration">
                                Czas trwania
                            </label>
                            <div className="services-create-control">
                                <div className="services-create-inline">
                                    <input
                                        id="service_duration"
                                        type="number"
                                        min="0"
                                        className="form-control services-create-number"
                                        value={duration}
                                        onChange={(event) =>
                                            setDuration(event.target.value)
                                        }
                                        disabled={measureKind === 'multiple'}
                                    />
                                    <span>minut</span>
                                    <button
                                        type="button"
                                        className="button button-link"
                                        onClick={() =>
                                            setShowDurationModal(true)
                                        }
                                    >
                                        Zaawansowane
                                    </button>
                                </div>

                                {hasDurationBefore ||
                                hasDurationAfter ||
                                hasBreak ? (
                                    <div className="services-create-panel">
                                        <div className="services-create-extra-summary">
                                            {hasDurationBefore ? (
                                                <span>
                                                    blokada przed:{' '}
                                                    {durationBefore || '0'} min
                                                </span>
                                            ) : null}
                                            {hasBreak ? (
                                                <span>
                                                    przerwa: po{' '}
                                                    {breakOffset || '0'} min na{' '}
                                                    {breakDuration || '0'} min
                                                </span>
                                            ) : null}
                                            {hasDurationAfter ? (
                                                <span>
                                                    blokada po:{' '}
                                                    {durationAfter || '0'} min
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="services-create-help services-create-help--tight">
                                            Source UI używa dla tego pola
                                            osobnego modalu. W panelu
                                            odwzorowujemy ten flow, ale backend
                                            create nadal nie zapisuje tych
                                            wartości.
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        </li>

                        <li className="services-create-field">
                            <label htmlFor="service_price">Cena</label>
                            <div className="services-create-control">
                                {showMeasureKindBox ? (
                                    <div className="services-create-measure-box">
                                        <label>
                                            <input
                                                type="radio"
                                                checked={
                                                    measureKind === 'single'
                                                }
                                                onChange={() =>
                                                    setMeasureKind('single')
                                                }
                                            />
                                            Jeden wariant
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                checked={
                                                    measureKind ===
                                                    'single_with_range'
                                                }
                                                onChange={() =>
                                                    setMeasureKind(
                                                        'single_with_range',
                                                    )
                                                }
                                            />
                                            Widełki cenowe
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                checked={
                                                    measureKind === 'multiple'
                                                }
                                                onChange={() =>
                                                    setMeasureKind('multiple')
                                                }
                                            />
                                            Wiele wariantów
                                        </label>
                                    </div>
                                ) : null}

                                {measureKind !== 'multiple' ? (
                                    <div className="services-create-inline">
                                        <input
                                            id="service_price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="form-control services-create-number"
                                            value={price}
                                            onChange={(event) =>
                                                setPrice(event.target.value)
                                            }
                                        />
                                        {measureKind === 'single_with_range' ? (
                                            <>
                                                <span>do</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    className="form-control services-create-number"
                                                    value={priceMax}
                                                    onChange={(event) =>
                                                        setPriceMax(
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </>
                                        ) : null}
                                        <span>zł</span>
                                        <span className="services-create-muted">
                                            (brutto)
                                        </span>
                                        <button
                                            type="button"
                                            className="button button-link"
                                            onClick={() =>
                                                setShowMeasureKindBox(
                                                    (current) => !current,
                                                )
                                            }
                                        >
                                            Zaawansowane
                                        </button>
                                    </div>
                                ) : (
                                    <div className="services-create-variants">
                                        <table className="salonbw-table services-create-variants-table">
                                            <thead>
                                                <tr>
                                                    <th>Nazwa wariantu</th>
                                                    <th>Czas trwania</th>
                                                    <th>Cena</th>
                                                    <th>usuń</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {variants.map((variant) => (
                                                    <tr key={variant.key}>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={
                                                                    variant.name
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateVariant(
                                                                        variant.key,
                                                                        'name',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="np. włosy długie"
                                                            />
                                                        </td>
                                                        <td>
                                                            <div className="services-create-inline">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="form-control services-create-number"
                                                                    value={
                                                                        variant.duration
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateVariant(
                                                                            variant.key,
                                                                            'duration',
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                                <span>min</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="services-create-inline">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    className="form-control services-create-number"
                                                                    value={
                                                                        variant.price
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        updateVariant(
                                                                            variant.key,
                                                                            'price',
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                                <span>zł</span>
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                type="button"
                                                                className="button button-link services-create-delete"
                                                                onClick={() =>
                                                                    removeVariant(
                                                                        variant.key,
                                                                    )
                                                                }
                                                            >
                                                                usuń
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="mt-m">
                                            <button
                                                type="button"
                                                className="button"
                                                onClick={addVariant}
                                            >
                                                dodaj kolejny wariant
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </li>

                        <li className="services-create-field">
                            <label htmlFor="service_vat">VAT</label>
                            <div className="services-create-control">
                                <select
                                    id="service_vat"
                                    className="salonbw-select services-create-select services-create-select--small"
                                    value={vatCode}
                                    onChange={(event) =>
                                        setVatCode(
                                            event.target.value as VatCode,
                                        )
                                    }
                                >
                                    {VAT_OPTIONS.map((option) => (
                                        <option
                                            key={option.code}
                                            value={option.code}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </li>

                        <li className="services-create-field">
                            <label htmlFor="service_description">
                                Opis publiczny
                            </label>
                            <div className="services-create-control">
                                <textarea
                                    id="service_description"
                                    className="form-control services-create-textarea"
                                    value={publicDescription}
                                    onChange={(event) =>
                                        setPublicDescription(event.target.value)
                                    }
                                />
                            </div>
                        </li>

                        <li className="services-create-field">
                            <label htmlFor="service_private_description">
                                Opis prywatny
                            </label>
                            <div className="services-create-control">
                                <textarea
                                    id="service_private_description"
                                    className="form-control services-create-textarea"
                                    value={privateDescription}
                                    onChange={(event) =>
                                        setPrivateDescription(
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                        </li>

                        <li className="services-create-field">
                            <label>Zdjęcia</label>
                            <div className="services-create-control">
                                <div className="services-create-gallery">
                                    <div className="services-create-panel services-create-upload-panel">
                                        <label className="btn btn-default services-create-upload-trigger">
                                            dodaj zdjęcia
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="sr-only"
                                                onChange={(event) => {
                                                    const files = Array.from(
                                                        event.target.files ??
                                                            [],
                                                    );
                                                    if (files.length === 0) {
                                                        return;
                                                    }
                                                    setSelectedFiles(files);
                                                    event.currentTarget.value =
                                                        '';
                                                }}
                                            />
                                        </label>
                                        {selectedFiles.length > 0 ? (
                                            <ul className="services-create-file-list">
                                                {selectedFiles.map((file) => (
                                                    <li key={file.name}>
                                                        <span>{file.name}</span>
                                                        <span className="services-create-muted">
                                                            {Math.max(
                                                                1,
                                                                Math.round(
                                                                    file.size /
                                                                        1024,
                                                                ),
                                                            )}{' '}
                                                            KB
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </div>
                                    <p className="services-create-help services-create-help--tight">
                                        Source UI używa uploadu `Filedata` z
                                        `gallery_id`. Po zapisaniu usługi
                                        wybrane pliki są wysyłane osobnym
                                        requestem multipart do backendu panelu.
                                    </p>
                                </div>
                            </div>
                        </li>
                    </ol>

                    <legend className="services-create-legend">
                        Zaawansowane{' '}
                        <button
                            type="button"
                            className="button button-link"
                            onClick={() =>
                                setShowAdvancedSection((current) => !current)
                            }
                        >
                            {showAdvancedSection ? 'Ukryj' : 'Pokaż'}
                        </button>
                    </legend>

                    {showAdvancedSection ? (
                        <div className="services-create-advanced">
                            <div className="services-create-field">
                                <label htmlFor="service_online_booking">
                                    Rezerwacja online
                                </label>
                                <div className="services-create-control">
                                    <select
                                        id="service_online_booking"
                                        className="salonbw-select services-create-select"
                                        value={onlineBookingMode}
                                        onChange={(event) =>
                                            setOnlineBookingMode(
                                                event.target
                                                    .value as OnlineBookingMode,
                                            )
                                        }
                                    >
                                        <option value="online_booking_enabled">
                                            Usługę można rezerwować online
                                        </option>
                                        <option value="online_booking_hidden">
                                            Rezerwacja online zablokowana.
                                            Usługa nie jest widoczna dla
                                            klientów.
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="services-create-field">
                                <label>Receptura</label>
                                <div className="services-create-control">
                                    <div className="services-create-panel">
                                        <button
                                            type="button"
                                            className="button button-link"
                                            onClick={() =>
                                                setShowRecipeTable(
                                                    (current) => !current,
                                                )
                                            }
                                        >
                                            {showRecipeTable
                                                ? 'ukryj recepturę'
                                                : 'zdefiniuj recepturę'}
                                        </button>
                                        {showRecipeTable ? (
                                            <div className="services-create-recipe">
                                                <table className="salonbw-table services-create-recipe-table">
                                                    <thead>
                                                        <tr>
                                                            <th>materiał</th>
                                                            <th>jednostka</th>
                                                            <th>ilość</th>
                                                            <th>usuń</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {recipeItems.map(
                                                            (item) => (
                                                                <tr
                                                                    key={
                                                                        item.key
                                                                    }
                                                                >
                                                                    <td className="services-create-recipe-cell">
                                                                        <input
                                                                            type="text"
                                                                            className="form-control"
                                                                            placeholder="wpisz nazwę, kod kreskowy, itp."
                                                                            value={
                                                                                item.productName
                                                                            }
                                                                            onFocus={() => {
                                                                                setActiveRecipeRowKey(
                                                                                    item.key,
                                                                                );
                                                                                setRecipeProductSearch(
                                                                                    item.productName,
                                                                                );
                                                                            }}
                                                                            onChange={(
                                                                                event,
                                                                            ) => {
                                                                                updateRecipeItem(
                                                                                    item.key,
                                                                                    'productId',
                                                                                    null,
                                                                                );
                                                                                updateRecipeItem(
                                                                                    item.key,
                                                                                    'productName',
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                );
                                                                                setActiveRecipeRowKey(
                                                                                    item.key,
                                                                                );
                                                                                setRecipeProductSearch(
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                );
                                                                            }}
                                                                        />
                                                                        {activeRecipeRowKey ===
                                                                            item.key &&
                                                                        recipeSuggestions.length >
                                                                            0 ? (
                                                                            <div className="services-create-recipe-suggestions">
                                                                                {recipeSuggestions.map(
                                                                                    (
                                                                                        product,
                                                                                    ) => (
                                                                                        <button
                                                                                            key={
                                                                                                product.id
                                                                                            }
                                                                                            type="button"
                                                                                            className="services-create-recipe-option"
                                                                                            onClick={() => {
                                                                                                updateRecipeItem(
                                                                                                    item.key,
                                                                                                    'productId',
                                                                                                    product.id,
                                                                                                );
                                                                                                updateRecipeItem(
                                                                                                    item.key,
                                                                                                    'productName',
                                                                                                    product.name,
                                                                                                );
                                                                                                updateRecipeItem(
                                                                                                    item.key,
                                                                                                    'unit',
                                                                                                    product.unit ||
                                                                                                        product.packageUnit ||
                                                                                                        'op.',
                                                                                                );
                                                                                                setActiveRecipeRowKey(
                                                                                                    null,
                                                                                                );
                                                                                                setRecipeProductSearch(
                                                                                                    '',
                                                                                                );
                                                                                            }}
                                                                                        >
                                                                                            <span>
                                                                                                {
                                                                                                    product.name
                                                                                                }
                                                                                            </span>
                                                                                            <span className="services-create-muted">
                                                                                                {product.unit ||
                                                                                                    product.packageUnit ||
                                                                                                    'op.'}
                                                                                            </span>
                                                                                        </button>
                                                                                    ),
                                                                                )}
                                                                            </div>
                                                                        ) : null}
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="form-control"
                                                                            value={
                                                                                item.unit
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                updateRecipeItem(
                                                                                    item.key,
                                                                                    'unit',
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            className="form-control services-create-number"
                                                                            value={
                                                                                item.quantity
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                updateRecipeItem(
                                                                                    item.key,
                                                                                    'quantity',
                                                                                    event
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <button
                                                                            type="button"
                                                                            className="button button-link services-create-delete"
                                                                            onClick={() =>
                                                                                removeRecipeItem(
                                                                                    item.key,
                                                                                )
                                                                            }
                                                                        >
                                                                            usuń
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )}
                                                    </tbody>
                                                </table>
                                                <button
                                                    type="button"
                                                    className="button"
                                                    onClick={addRecipeItem}
                                                >
                                                    dodaj kolejną pozycję
                                                </button>
                                            </div>
                                        ) : null}
                                        <p className="services-create-help services-create-help--tight">
                                            Receptura odwzorowuje realny układ
                                            source UI i po zapisie usługi jest
                                            wysyłana osobnym requestem do
                                            `/services/:id/recipe`.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div className="form-actions">
                        <div className="pull_right cancel-link">
                            <Link href="/services">anuluj</Link>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSaving}
                        >
                            zapisz usługę
                        </button>
                        <button
                            type="button"
                            className="button"
                            disabled={isSaving}
                            onClick={() =>
                                void handleSubmit('save_and_add_another')
                            }
                        >
                            zapisz i dodaj kolejną
                        </button>
                    </div>
                </fieldset>
            </form>

            <ManageCategoriesModal
                isOpen={isCategoriesOpen}
                categories={categories}
                onClose={() => setIsCategoriesOpen(false)}
            />

            {showDurationModal ? (
                <div
                    className="modal fade in services-create-modal-open"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <button
                                    type="button"
                                    className="close"
                                    onClick={() => setShowDurationModal(false)}
                                    aria-label="Zamknij"
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button>
                                <h4 className="modal-title">Odstępy czasowe</h4>
                            </div>
                            <div className="modal-body">
                                <div className="services-create-time-modal">
                                    <h3>Nowa usługa - {duration || '0'} min</h3>
                                    <div className="services-create-time-row">
                                        <label className="services-create-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={hasDurationBefore}
                                                onChange={(event) =>
                                                    setHasDurationBefore(
                                                        event.target.checked,
                                                    )
                                                }
                                            />
                                            <span>
                                                Blokada czasu przed usługą
                                            </span>
                                        </label>
                                        <div className="services-create-inline">
                                            <input
                                                type="number"
                                                min="0"
                                                className="form-control services-create-number"
                                                value={durationBefore}
                                                onChange={(event) =>
                                                    setDurationBefore(
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={!hasDurationBefore}
                                            />
                                            <span>min</span>
                                        </div>
                                    </div>
                                    <div className="services-create-time-row">
                                        <label className="services-create-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={hasBreak}
                                                onChange={(event) =>
                                                    setHasBreak(
                                                        event.target.checked,
                                                    )
                                                }
                                            />
                                            <span>Przerwa w usłudze</span>
                                        </label>
                                        <div className="services-create-inline">
                                            <span>po</span>
                                            <input
                                                type="number"
                                                min="0"
                                                className="form-control services-create-number"
                                                value={breakOffset}
                                                onChange={(event) =>
                                                    setBreakOffset(
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={!hasBreak}
                                            />
                                            <span>min na</span>
                                            <input
                                                type="number"
                                                min="0"
                                                className="form-control services-create-number"
                                                value={breakDuration}
                                                onChange={(event) =>
                                                    setBreakDuration(
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={!hasBreak}
                                            />
                                            <span>min</span>
                                        </div>
                                    </div>
                                    <div className="services-create-time-row">
                                        <label className="services-create-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={hasDurationAfter}
                                                onChange={(event) =>
                                                    setHasDurationAfter(
                                                        event.target.checked,
                                                    )
                                                }
                                            />
                                            <span>
                                                Blokada czasu po usłudze
                                            </span>
                                        </label>
                                        <div className="services-create-inline">
                                            <input
                                                type="number"
                                                min="0"
                                                className="form-control services-create-number"
                                                value={durationAfter}
                                                onChange={(event) =>
                                                    setDurationAfter(
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={!hasDurationAfter}
                                            />
                                            <span>min</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => setShowDurationModal(false)}
                                >
                                    zatwierdź
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-default"
                                    onClick={() => setShowDurationModal(false)}
                                >
                                    anuluj
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
