'use client';
import { useEffect, useRef, ReactNode } from 'react';

interface ScrollRevealProps {
    children: ReactNode;
    delay?: number;
    direction?: 'up' | 'left' | 'right';
    className?: string;
}

export default function ScrollReveal({ children, delay = 0, direction = 'up', className = '' }: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (!('IntersectionObserver' in window)) {
            el.classList.add('sr-visible');
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.style.transitionDelay = `${delay}ms`;
                    el.classList.add('sr-visible');
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [delay]);

    return (
        <div ref={ref} className={`sr-init sr-${direction} ${className}`}>
            {children}
        </div>
    );
}
