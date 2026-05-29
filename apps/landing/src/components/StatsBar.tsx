'use client';
import { useRef, useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const STAT_NUMBERS = ['15', '3 000', '4.9', '30'];

function useInView(ref: React.RefObject<HTMLDivElement | null>) {
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (!('IntersectionObserver' in window)) {
            setInView(true);
            return;
        }
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry?.isIntersecting) { setInView(true); obs.disconnect(); } },
            { threshold: 0.25 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [ref]);
    return inView;
}

export default function StatsBar() {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref);
    const { T } = useLanguage();

    return (
        <div className="stats-bar" ref={ref}>
            <div className="stats-bar__inner">
                {T.stats.map((stat, i) => (
                    <div key={stat.label} className="stats-bar__item">
                        <span
                            className="stats-bar__number"
                            style={{
                                opacity: inView ? 1 : 0,
                                transform: inView ? 'none' : 'translateY(14px)',
                                transition: `opacity 0.7s ${i * 0.13}s ease, transform 0.7s ${i * 0.13}s ease`,
                            }}
                        >
                            {STAT_NUMBERS[i]}{stat.suffix}
                        </span>
                        <span
                            className="stats-bar__label"
                            style={{
                                opacity: inView ? 1 : 0,
                                transition: `opacity 0.7s ${i * 0.13 + 0.2}s ease`,
                            }}
                        >
                            {stat.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
