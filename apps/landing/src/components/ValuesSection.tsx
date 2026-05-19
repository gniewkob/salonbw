'use client';
import { useState, useCallback } from 'react';
import SectionHeader from './SectionHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    Palette,
    Star,
    User,
    Heart,
    Shield,
    Leaf,
    type LucideIcon,
} from 'lucide-react';

type CoreValue = { id: string; title: string; description: string };

const VALUE_ICONS: Record<string, LucideIcon> = {
    pasja: Palette,
    profesjonalizm: Star,
    indywidualne: User,
    zadowolenie: Heart,
    higiena: Shield,
    srodowisko: Leaf,
};

export default function ValuesSection() {
    const { T } = useLanguage();
    const data: CoreValue[] = T.values.items as unknown as CoreValue[];
    const [active, setActive] = useState<string>(data[0]?.id ?? '');

    const activeValue = data.find(v => v.id === active);

    const handleKeyDown = useCallback((e: React.KeyboardEvent, id: string) => {
        const idx = data.findIndex(v => v.id === id);
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            setActive(data[(idx + 1) % data.length]?.id ?? id);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            setActive(data[(idx - 1 + data.length) % data.length]?.id ?? id);
        }
    }, [data]);

    return (
        <section className="py-20 md:py-28" style={{ background: '#faf9f7' }}>
            <div className="container mx-auto px-4 md:px-8">
                <SectionHeader eyebrow={T.values.eyebrow} title={T.values.title} />

                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6 mb-12" role="tablist" aria-label={T.values.title}>
                    {data.map(value => {
                        const Icon = VALUE_ICONS[value.id] ?? Star;
                        const isActive = active === value.id;
                        return (
                            <button
                                key={value.id}
                                id={`tab-${value.id}`}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={`tabpanel-${value.id}`}
                                tabIndex={isActive ? 0 : -1}
                                onClick={() => setActive(value.id)}
                                onKeyDown={e => handleKeyDown(e, value.id)}
                                className="flex flex-col items-center gap-3 py-5 px-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c5a880] focus:ring-offset-2"
                                style={{
                                    background: isActive ? '#0d0d0d' : '#ffffff',
                                    border: isActive ? '1px solid #0d0d0d' : '1px solid #ede9e3',
                                    borderRadius: '3px',
                                }}
                            >
                                <div className="w-9 h-9 flex items-center justify-center" style={{ background: isActive ? 'rgba(197,168,128,0.2)' : 'rgba(197,168,128,0.1)', borderRadius: '2px' }}>
                                    <Icon size={18} strokeWidth={1.5} style={{ color: '#c5a880' }} />
                                </div>
                                <span
                                    className="text-center leading-tight"
                                    style={{ fontFamily: "var(--font-open-sans), sans-serif", fontSize: '0.7rem', fontWeight: 600, color: isActive ? '#ffffff' : '#6b5f52', letterSpacing: '0.03em' }}
                                >
                                    {value.title}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {activeValue && (
                    <div id={`tabpanel-${activeValue.id}`} role="tabpanel" aria-labelledby={`tab-${activeValue.id}`} className="max-w-2xl mx-auto text-center">
                        <p className="text-base leading-relaxed" style={{ color: '#4a3f35', fontFamily: "var(--font-playfair), serif", fontStyle: 'italic' }}>
                            &ldquo;{activeValue.description}&rdquo;
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
