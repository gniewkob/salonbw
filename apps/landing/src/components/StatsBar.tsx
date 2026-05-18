'use client';
import { useEffect, useRef, useState } from 'react';

const stats = [
    { target: 30, suffix: '+', label: 'lat doświadczenia' },
    { target: 2011, suffix: '', label: 'rok założenia' },
    { target: 5, suffix: '', label: 'kluczowych wartości' },
    { target: 5, suffix: '★', label: 'ocena klientek' },
];

function useCountUp(target: number, duration = 1400, active: boolean) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!active) return;
        const start = performance.now();
        const raf = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(Math.round(eased * target));
            if (t < 1) requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);
    }, [active, target, duration]);
    return value;
}

function StatItem({ target, suffix, label, delay }: { target: number; suffix: string; label: string; delay: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);
    const value = useCountUp(target, 1400, active);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setActive(true); observer.unobserve(el); }
        }, { threshold: 0.4 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className="stats-bar__item" style={{ transitionDelay: `${delay}ms` }}>
            <span className="stats-bar__number">{value}{suffix}</span>
            <span className="stats-bar__label">{label}</span>
        </div>
    );
}

export default function StatsBar() {
    return (
        <section className="stats-bar" aria-label="Liczby o salonie">
            <div className="stats-bar__inner">
                {stats.map((s, i) => (
                    <StatItem key={s.label} {...s} delay={i * 100} />
                ))}
            </div>
        </section>
    );
}
