import type { Service } from '@/types';
import type { BookingService } from '@/components/BookingModal';

export interface ServicePriceDetailRow {
    key: string;
    name: string;
    priceLabel: string;
    durationLabel: string;
    /** A flat Booksy service has its own bookable serviceId. Nested variants
     *  cannot be deep-linked by ID via the current booking modal contract. */
    bookingService: BookingService | null;
}

const formatPLN = (price: number): string =>
    new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
    }).format(price);

/**
 * Show the actual booking-catalog variants, not a separate marketing price list.
 * Booksy may represent a variant as its own service ("name – length") or as
 * a nested ServiceVariant. Exclude inactive nested variants from public copy.
 */
export function servicePriceDetailRows(
    services: readonly Service[],
    fromLabel: string,
): ServicePriceDetailRow[] {
    return services.flatMap((service) => {
        const activeVariants =
            service.variants?.filter((variant) => variant.isActive !== false) ??
            [];

        if (activeVariants.length === 0) {
            return [
                {
                    key: `service-${service.id}`,
                    name: service.name,
                    priceLabel:
                        service.priceType === 'from'
                            ? `${fromLabel} ${formatPLN(service.price)}`
                            : formatPLN(service.price),
                    durationLabel: `${service.duration} min`,
                    bookingService:
                        service.onlineBooking === false
                            ? null
                            : {
                                  id: service.id,
                                  name: service.name,
                                  priceLabel:
                                      service.priceType === 'from'
                                          ? `${fromLabel} ${formatPLN(service.price)}`
                                          : formatPLN(service.price),
                                  duration: `${service.duration} min`,
                              },
                },
            ];
        }

        return activeVariants.map((variant) => ({
            key: `service-${service.id}-variant-${variant.id}`,
            name: `${service.name} — ${variant.name}`,
            priceLabel:
                variant.priceType === 'from'
                    ? `${fromLabel} ${formatPLN(variant.price)}`
                    : formatPLN(variant.price),
            durationLabel: `${variant.duration} min`,
            bookingService: null,
        }));
    });
}

interface ServicePriceBreakdownProps {
    services: readonly Service[];
    fromLabel: string;
    label: string;
    bookLabel?: string;
    /** Explains where nested variants are selected without exposing variantId as serviceId. */
    wizardHint?: string;
    onBookService?: (service: BookingService) => void;
}

/**
 * Native details/summary provides keyboard activation and an exposed expanded
 * state without a custom disclosure controller. Flat Booksy options may book
 * their real service IDs; nested variant IDs are never passed as service IDs.
 */
export default function ServicePriceBreakdown({
    services,
    fromLabel,
    label,
    bookLabel,
    wizardHint,
    onBookService,
}: ServicePriceBreakdownProps) {
    const rows = servicePriceDetailRows(services, fromLabel);
    const hasNestedVariants = services.some((service) =>
        service.variants?.some((variant) => variant.isActive !== false),
    );

    if (rows.length < 2) return null;

    return (
        <details className="svcs-price-details">
            <summary className="svcs-price-details__summary">{label}</summary>
            <ul className="svcs-price-details__list">
                {rows.map((row) => (
                    <li key={row.key} className="svcs-price-details__item">
                        <span className="svcs-price-details__name">
                            {row.name}
                        </span>
                        <span className="svcs-price-details__value">
                            <strong>{row.priceLabel}</strong>
                            <span>{row.durationLabel}</span>
                        </span>
                        {row.bookingService && onBookService && bookLabel ? (
                            <button
                                type="button"
                                className="svcs-price-details__book"
                                aria-label={`${bookLabel}: ${row.name}`}
                                onClick={() => onBookService(row.bookingService!)}
                            >
                                {bookLabel}
                            </button>
                        ) : null}
                    </li>
                ))}
            </ul>
            {hasNestedVariants && wizardHint ? (
                <p className="svcs-price-details__hint">{wizardHint}</p>
            ) : null}
        </details>
    );
}
