import {
    createContext,
    useContext,
    useState,
    useCallback,
    useLayoutEffect,
    type ReactNode,
} from 'react';

interface SecondaryNavContextValue {
    secondaryNav: ReactNode;
    setSecondaryNav: (nav: ReactNode) => void;
}

const SecondaryNavContext = createContext<SecondaryNavContextValue | null>(
    null,
);

export function SecondaryNavProvider({ children }: { children: ReactNode }) {
    const [secondaryNav, setSecondaryNavState] = useState<ReactNode>(null);
    const setSecondaryNav = useCallback((nav: ReactNode) => {
        setSecondaryNavState(nav);
    }, []);
    return (
        <SecondaryNavContext.Provider value={{ secondaryNav, setSecondaryNav }}>
            {children}
        </SecondaryNavContext.Provider>
    );
}

// Internal — used by VersumShell to detect if a parent shell is already mounted
export function useSecondaryNavContext(): SecondaryNavContextValue | null {
    return useContext(SecondaryNavContext);
}

// Public — customer pages call this instead of passing secondaryNav prop to VersumShell
export function useSetSecondaryNav(nav: ReactNode): void {
    const ctx = useContext(SecondaryNavContext);
    // No dependency array: nav JSX is referentially unstable (inline objects).
    // useLayoutEffect runs before paint → no flicker on first render.
    // Cleanup on unmount clears stale nav when navigating away.
    useLayoutEffect(() => {
        if (!ctx) return;
        ctx.setSecondaryNav(nav);
        return () => {
            ctx.setSecondaryNav(null);
        };
    });
}
