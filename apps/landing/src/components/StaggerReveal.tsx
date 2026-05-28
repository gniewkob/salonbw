'use client';
import { useEffect, useRef, ReactNode } from 'react';

interface StaggerRevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

export default function StaggerReveal({ children, className = '', delay = 130 }: StaggerRevealProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (!('IntersectionObserver' in window)) {
            el.classList.add('sr-stagger-visible');
            return;
        }

        Array.from(el.children).forEach((child, i) => {
            (child as HTMLElement).style.transitionDelay = `${i * delay}ms`;
        });

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('sr-stagger-visible');
                    observer.unobserve(el);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [delay]);

    return (
        <div ref={ref} className={`sr-stagger ${className}`}>
            {children}
        </div>
    );
}
