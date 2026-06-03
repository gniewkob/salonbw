import { useEffect, useState } from 'react';

export function useReceptionNowTick(active: boolean): number {
    const [tick, setTick] = useState(() => Date.now());

    useEffect(() => {
        if (!active) return;

        const timerId = window.setInterval(() => {
            setTick(Date.now());
        }, 60_000);

        return () => {
            window.clearInterval(timerId);
        };
    }, [active]);

    return tick;
}
