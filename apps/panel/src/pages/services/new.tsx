'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import ManageCategoriesModal from '@/components/services/ManageCategoriesModal';
import { useAuth } from '@/contexts/AuthContext';
import {
    useCreateService,
    useServiceCategories,
} from '@/hooks/useServicesAdmin';
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

function formatCategoryLabel(name: string, depth: number) {
    return `${'\u00A0'.repeat(depth * 4)}${name}`;
}

export default function NewServicePage() {
    const { role } = useAuth();

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:services">
            <VersumShell role={role}>
                <NewServicePageContent />
            </VersumShell>
        </RouteGuard>
    );
}

function NewServicePageContent() {
    const router = useRouter();
    const { data: categories = [] } = useServiceCategories();
    const createService = useCreateService();

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
    const [showDurationAdvanced, setShowDurationAdvanced] = useState(false);
    const [showAdvancedSection, setShowAdvancedSection] = useState(false);
    const [durationBefore, setDurationBefore] = useState('');
    const [durationAfter, setDurationAfter] = useState('');
    const [breakOffset, setBreakOffset] = useState('');
    const [breakDuration, setBreakDuration] = useState('');
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
        setShowDurationAdvanced(false);
        setShowAdvancedSection(false);
        setDurationBefore('');
        setDurationAfter('');
        setBreakOffset('');
        setBreakDuration('');
        setVatCode('23');
        setPublicDescription('');
        setPrivateDescription('');
        setOnlineBookingMode('online_booking_enabled');
        setVariants([createVariantDraft(1), createVariantDraft(2)]);
        setNextVariantKey(3);
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

            if (mode === 'save_and_add_another') {
                resetForm();
                setNotice('Usługa została zapisana. Możesz dodać kolejną.');
                return;
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
        <div className="versum-page services-create-page">
            <ul className="breadcrumb">
                <li>
                    <i
                        className="icon sprite-breadcrumbs_services"
                        aria-hidden="true"
                    />{' '}
                    <Link href="/services">Usługi</Link> / Dodawanie
                </li>
            </ul>

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
                                    className="versum-select services-create-select"
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
                                            setShowDurationAdvanced(
                                                (current) => !current,
                                            )
                                        }
                                    >
                                        Zaawansowane
                                    </button>
                                </div>

                                {showDurationAdvanced ? (
                                    <div className="services-create-panel">
                                        <div className="services-create-grid">
                                            <label>
                                                <span>Przygotowanie przed</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="form-control"
                                                    value={durationBefore}
                                                    onChange={(event) =>
                                                        setDurationBefore(
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </label>
                                            <label>
                                                <span>Czas po usłudze</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="form-control"
                                                    value={durationAfter}
                                                    onChange={(event) =>
                                                        setDurationAfter(
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </label>
                                            <label>
                                                <span>Przerwa po</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="form-control"
                                                    value={breakOffset}
                                                    onChange={(event) =>
                                                        setBreakOffset(
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </label>
                                            <label>
                                                <span>Czas przerwy</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="form-control"
                                                    value={breakDuration}
                                                    onChange={(event) =>
                                                        setBreakDuration(
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </label>
                                        </div>
                                        <p className="services-create-help services-create-help--tight">
                                            Parametry czasu dodatkowego są
                                            zachowane lokalnie dla parity UI.
                                            Obecny backend create-flow nie
                                            zapisuje jeszcze tych wartości.
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
                                        <table className="versum-table services-create-variants-table">
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
                                    className="versum-select services-create-select services-create-select--small"
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
                                    <button
                                        type="button"
                                        className="button"
                                        disabled
                                    >
                                        dodaj zdjęcia
                                    </button>
                                    <p className="services-create-help services-create-help--tight">
                                        Zdjęcia dodasz po zapisaniu usługi, w
                                        szczegółach rekordu.
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
                                        className="versum-select services-create-select"
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
                                            className="button"
                                            disabled
                                        >
                                            zdefiniuj recepturę
                                        </button>
                                        <p className="services-create-help services-create-help--tight">
                                            Receptura jest wspierana w
                                            szczegółach usługi po pierwszym
                                            zapisie. Ten ekran zachowuje parity
                                            układu create-flow, ale nie ma
                                            jeszcze pełnego create kontraktu dla
                                            materiałów.
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
        </div>
    );
}
