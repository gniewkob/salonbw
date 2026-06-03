import { resolveSalonIcon } from './SalonIconRegistry';

interface SalonIconProps {
    id: string;
    className?: string;
}

/**
 * Drop-in replacement for the old sprite-based icon renderer. Looks up the
 * iconId in SALON_ICON_REGISTRY and renders the corresponding Heroicon.
 * Unknown IDs render nothing (instead of the broken `<use href="#missing"/>`
 * the sprite version used to produce) — surfaces "wrong ID" bugs without
 * breaking the rest of the layout.
 */
export default function SalonIcon({ id, className }: SalonIconProps) {
    const Icon = resolveSalonIcon(id);
    if (!Icon) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[SalonIcon] unknown icon id:', id);
        }
        return null;
    }
    return (
        <Icon
            aria-hidden="true"
            focusable="false"
            className={className ?? 'salonbw-icon'}
        />
    );
}
