import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export const CREATIVE_DIRECTIONS = ['fashion', 'cinematic', 'atelier'] as const;
export type CreativeDirection = (typeof CREATIVE_DIRECTIONS)[number];

export function normalizeCreativeDirection(value: string | null | undefined): CreativeDirection | null {
    return CREATIVE_DIRECTIONS.find((direction) => direction === value) ?? null;
}

// This studio is deliberately absent from production builds. It holds no customer state.
export const creativeStudioEnabled = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development';
const CreativeContext = createContext<CreativeDirection>('fashion');

export function useCreativeDirection(): CreativeDirection {
    return useContext(CreativeContext);
}

const LABELS: Record<CreativeDirection, string> = {
    fashion: '01 / Fashion Editorial',
    cinematic: '02 / Cinematic Monochrome',
    atelier: '03 / Swiss Atelier',
};

export default function CreativeDirectionStudio({ children }: { children: ReactNode }) {
    const [direction, setDirection] = useState<CreativeDirection>('fashion');

    useEffect(() => {
        if (!creativeStudioEnabled) return;
        try {
            const query = new URLSearchParams(window.location.search).get('edition');
            const stored = window.sessionStorage.getItem('salonbw-creative-direction');
            const selected = normalizeCreativeDirection(query) ?? normalizeCreativeDirection(stored);
            if (selected) setDirection(selected);
        } catch {
            // Private browsing / storage restrictions must never block navigation.
        }
    }, []);

    if (!creativeStudioEnabled) return <>{children}</>;

    function selectDirection(next: CreativeDirection) {
        setDirection(next);
        try {
            window.sessionStorage.setItem('salonbw-creative-direction', next);
        } catch {
            // Preview still works for this page even if storage is unavailable.
        }
    }

    return (
        <CreativeContext.Provider value={direction}>
            <div className={`creative-studio creative-studio--${direction}`} data-wdi-direction={direction}>
                <nav className="creative-switcher" aria-label="Podgląd kierunków wizualnych — tylko DEV">
                    <span className="creative-switcher__label">B&amp;W / Design Lab <span>DEV ONLY</span></span>
                    <div className="creative-switcher__options" role="group" aria-label="Kierunek wizualny">
                        {CREATIVE_DIRECTIONS.map((item) => (
                            <button
                                key={item}
                                type="button"
                                aria-pressed={direction === item}
                                onClick={() => selectDirection(item)}
                            >
                                {LABELS[item]}
                            </button>
                        ))}
                    </div>
                </nav>
                {children}
            </div>
        </CreativeContext.Provider>
    );
}
