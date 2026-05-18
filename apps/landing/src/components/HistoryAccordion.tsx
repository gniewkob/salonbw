'use client';
import { useState } from 'react';
import { HISTORY_ITEMS } from '@/config/content';

type HistoryItem = { id: string; title: string; content: string };
interface HistoryAccordionProps { items?: HistoryItem[]; }

const YEAR_MAP: Record<string, string> = {
    historia: '30+ lat',
    poczatek: '2011',
    wartosci: 'dziś',
};

export default function HistoryAccordion({ items }: HistoryAccordionProps) {
    const data = items ?? (HISTORY_ITEMS as unknown as HistoryItem[]);
    const [openItem, setOpenItem] = useState<string | null>(data[0]?.id ?? null);

    const toggle = (id: string) => setOpenItem(prev => prev === id ? null : id);

    return (
        <section className="py-20 md:py-28" style={{ background: '#0d0d0d' }}>
            <div className="container mx-auto px-4 md:px-8">
                <div className="text-center mb-14">
                    <p className="text-xs tracking-widest uppercase mb-3" style={{ color: '#c5a880', letterSpacing: '0.22em', fontFamily: "'Open Sans', sans-serif" }}>
                        Skąd pochodzimy
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#ffffff' }}>
                        Nasza historia
                    </h2>
                    <div className="mx-auto mt-4" style={{ width: '40px', height: '2px', background: '#c5a880' }} />
                </div>

                <div className="max-w-2xl mx-auto space-y-0">
                    {data.map((item, idx) => {
                        const isOpen = openItem === item.id;
                        return (
                            <div key={item.id} style={{ borderTop: idx === 0 ? '1px solid rgba(255,255,255,0.1)' : 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <button
                                    type="button"
                                    onClick={() => toggle(item.id)}
                                    className="w-full py-6 flex justify-between items-center text-left transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#c5a880] focus:ring-inset"
                                    aria-expanded={isOpen}
                                    aria-controls={`history-content-${item.id}`}
                                >
                                    <div className="flex items-center gap-5">
                                        <span className="text-xs font-mono w-10 shrink-0" style={{ color: '#c5a880' }}>
                                            {YEAR_MAP[item.id] ?? '—'}
                                        </span>
                                        <h3 className="text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: isOpen ? '#c5a880' : '#ffffff', transition: 'color 0.2s' }}>
                                            {item.title}
                                        </h3>
                                    </div>
                                    <svg
                                        className="shrink-0 ml-4 transition-transform duration-300"
                                        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', color: '#c5a880' }}
                                        width={18} height={18} fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isOpen && (
                                    <div
                                        id={`history-content-${item.id}`}
                                        className="pb-6 pl-15"
                                        style={{ paddingLeft: '60px' }}
                                        role="region"
                                    >
                                        <p className="leading-relaxed text-sm md:text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                            {item.content}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
