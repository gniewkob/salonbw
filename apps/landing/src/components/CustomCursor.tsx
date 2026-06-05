import { useEffect, useRef } from 'react';

export default function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const dot = dotRef.current;
        const ring = ringRef.current;
        if (!dot || !ring) return;

        let mouseX = 0, mouseY = 0;
        let ringX = 0, ringY = 0;
        let rafId: number;

        const onMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
        };

        const animate = () => {
            ringX += (mouseX - ringX) * 0.12;
            ringY += (mouseY - ringY) * 0.12;
            ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
            rafId = requestAnimationFrame(animate);
        };

        const onEnterLink = () => ring.classList.add('cursor-expand');
        const onLeaveLink = () => ring.classList.remove('cursor-expand');

        document.addEventListener('mousemove', onMove);
        rafId = requestAnimationFrame(animate);

        document.querySelectorAll('a, button').forEach(el => {
            el.addEventListener('mouseenter', onEnterLink);
            el.addEventListener('mouseleave', onLeaveLink);
        });

        return () => {
            document.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <>
            <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
            <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
        </>
    );
}
