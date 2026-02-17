'use client';
import { useState, useEffect } from 'react';
import { CORE_VALUES } from '@/config/content';

type CoreValue = {
    id: string;
    title: string;
    icon: string;
    description: string;
};

interface ValuesSectionProps {
    values?: CoreValue[];
}

export default function ValuesSection({ values }: ValuesSectionProps) {
    const data = values ?? (CORE_VALUES as unknown as CoreValue[]);
    const [activeTab, setActiveTab] = useState<string>(
        data[0]?.id || '',
    );

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const currentIndex = data.findIndex(
                (v) => v.id === activeTab,
            );
            if (currentIndex === -1) return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prevIndex =
                    (currentIndex - 1 + data.length) %
                    data.length;
                setActiveTab(data[prevIndex].id);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % data.length;
                setActiveTab(data[nextIndex].id);
            }
        };

        const tabsContainer = document.getElementById('values-tabs');
        if (tabsContainer) {
            tabsContainer.addEventListener(
                'keydown',
                handleKeyDown as EventListener,
            );
            return () =>
                tabsContainer.removeEventListener(
                    'keydown',
                    handleKeyDown as EventListener,
                );
        }
    }, [activeTab, data]);

    const activeValue = data.find((v) => v.id === activeTab);

    return (
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                    Nasze Wartości
                </h2>

                {/* Tabs */}
                <div
                    id="values-tabs"
                    role="tablist"
                    aria-label="Core values"
                    className="flex flex-wrap justify-center gap-2 mb-8"
                >
                    {data.map((value) => {
                        const isActive = activeTab === value.id;
                        return (
                            <button
                                key={value.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={`tabpanel-${value.id}`}
                                tabIndex={isActive ? 0 : -1}
                                onClick={() => setActiveTab(value.id)}
                                className={`px-4 py-2 rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 ${
                                    isActive
                                        ? 'bg-brand-gold text-white'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <span className="mr-2">{value.icon}</span>
                                <span className="font-medium">
                                    {value.title}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Panel */}
                {activeValue && (
                    <div
                        id={`tabpanel-${activeValue.id}`}
                        role="tabpanel"
                        aria-labelledby={`tab-${activeValue.id}`}
                        className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8"
                    >
                        <div className="flex items-center mb-4">
                            <span className="text-4xl mr-4">
                                {activeValue.icon}
                            </span>
                            <h3 className="text-2xl font-bold">
                                {activeValue.title}
                            </h3>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {activeValue.description}
                        </p>
                    </div>
                )}

                {/* Hint */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    Użyj strzałek ← → do nawigacji lub kliknij zakładkę
                </p>
            </div>
        </section>
    );
}
