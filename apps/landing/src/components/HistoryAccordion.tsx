'use client';
import { useState } from 'react';
import { HISTORY_ITEMS } from '@/config/content';

export default function HistoryAccordion() {
    const [openItem, setOpenItem] = useState<string | null>(
        HISTORY_ITEMS[0]?.id || null,
    );

    const toggleItem = (id: string) => {
        setOpenItem((prev) => (prev === id ? null : id));
    };

    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                    Nasza Historia
                </h2>
                <div className="max-w-3xl mx-auto space-y-4">
                    {HISTORY_ITEMS.map((item) => {
                        const isOpen = openItem === item.id;
                        return (
                            <div
                                key={item.id}
                                className="border border-gray-200 rounded-lg overflow-hidden"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleItem(item.id)}
                                    className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-inset"
                                    aria-expanded={isOpen}
                                    aria-controls={`history-content-${item.id}`}
                                >
                                    <h3 className="text-xl font-semibold text-left">
                                        {item.title}
                                    </h3>
                                    <svg
                                        className={`w-6 h-6 transition-transform ${
                                            isOpen ? 'rotate-180' : ''
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>
                                {isOpen && (
                                    <div
                                        id={`history-content-${item.id}`}
                                        className="px-6 py-4 bg-white"
                                        role="region"
                                        aria-labelledby={`history-button-${item.id}`}
                                    >
                                        <p className="text-gray-700 leading-relaxed">
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
