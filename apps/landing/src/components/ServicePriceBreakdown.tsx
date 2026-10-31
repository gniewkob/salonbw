import type { Service } from '@/types';

export interface ServicePriceDetailRow {
    key: string;
    name: string;
    priceLabel: string;
    durationLabel: string;
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
        }));
    });
}

interface ServicePriceBreakdownProps {
    services: readonly Service[];
    fromLabel: string;
    label: string;
}

/**
 * Native details/summary provides keyboard activation and an exposed expanded
 * state without a custom disclosure controller. Existing booking buttons and
 * their service-ID routing remain unchanged.
 */
export default function ServicePriceBreakdown({
    services,
    fromLabel,
    label,
}: ServicePriceBreakdownProps) {
    const rows = servicePriceDetailRows(services, fromLabel);

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
                    </li>
                ))}
            </ul>
        </details>
    );
}
