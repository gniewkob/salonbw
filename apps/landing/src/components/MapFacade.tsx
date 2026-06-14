import { useState } from 'react';
import { BUSINESS_INFO } from '@/config/content';
import { useLanguage } from '@/contexts/LanguageContext';

interface MapFacadeProps {
    height?: number;
    /** grayscale amount applied to the loaded map, brand rule: muted media */
    grayscale?: number;
    /** Fill the parent's height (used to balance a tall sibling column);
     *  `height` then acts as a minimum so the map never collapses. */
    fill?: boolean;
}

/**
 * Click-to-load facade for the Google Maps embed. The iframe is the
 * heaviest third-party on the landing — loading it on demand keeps the
 * initial page light (Core Web Vitals) and avoids Google requests until
 * the visitor actually asks for the map.
 */
export default function MapFacade({
    height = 380,
    grayscale = 0.3,
    fill = false,
}: MapFacadeProps) {
    const [loaded, setLoaded] = useState(false);
    const { T } = useLanguage();
    const { lat, lng } = BUSINESS_INFO.coordinates;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const sizeStyle = fill
        ? { height: '100%', minHeight: `${height}px` }
        : { height: `${height}px` };

    if (loaded) {
        return (
            <iframe
                src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed&hl=pl`}
                className="relative w-full"
                style={{
                    ...sizeStyle,
                    borderRadius: '3px',
                    filter: `grayscale(${grayscale}) contrast(1.05)`,
                    zIndex: 1,
                    display: 'block',
                    border: 'none',
                }}
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                title={`Mapa salonu ${BUSINESS_INFO.name} w ${BUSINESS_INFO.address.city}`}
            />
        );
    }

    return (
        <div
            className="relative w-full flex flex-col items-center justify-center gap-4"
            style={{
                ...sizeStyle,
                borderRadius: '3px',
                background: '#161616',
                border: '1px solid rgba(180,184,190,0.25)',
                zIndex: 1,
            }}
        >
            {/* Crosshair pin — pure CSS, no external tiles */}
            <span
                aria-hidden
                style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: 'var(--brand-silver)',
                    boxShadow: '0 0 0 8px rgba(180,184,190,0.15)',
                }}
            />
            <p
                className="text-center text-sm px-6"
                style={{
                    color: 'rgba(255,255,255,0.75)',
                    fontFamily: 'var(--font-open-sans), sans-serif',
                    margin: 0,
                }}
            >
                {BUSINESS_INFO.address.street}, {BUSINESS_INFO.address.city}
            </p>
            <button
                type="button"
                onClick={() => setLoaded(true)}
                className="btn-silver text-xs font-semibold uppercase px-6 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b4b8be] focus:ring-offset-2 focus:ring-offset-[#161616]"
                style={{ letterSpacing: '0.14em', borderRadius: '2px', border: 'none', cursor: 'pointer' }}
            >
                {T.contact.showMap}
            </button>
            <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs uppercase"
                style={{
                    color: 'rgba(255,255,255,0.55)',
                    letterSpacing: '0.1em',
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                }}
            >
                {T.contact.openInMaps}
            </a>
        </div>
    );
}
