import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ToastModule = typeof import('react-hot-toast');

interface ToastContextValue {
    success: (msg: string) => void;
    error: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
    success: () => {},
    error: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toastApi, setToastApi] = useState<ToastModule | null>(null);

    useEffect(() => {
        let mounted = true;
        void import('react-hot-toast')
            .then((mod) => {
                if (mounted) setToastApi(mod);
            })
            .catch((err) => {
                console.warn('Failed to load toast module', err);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const value = useMemo<ToastContextValue>(() => {
        if (!toastApi) {
            return { success: () => {}, error: () => {} };
        }
        return {
            success: (msg) => toastApi.toast.success(msg),
            error: (msg) => toastApi.toast.error(msg),
        };
    }, [toastApi]);

    const ToasterComponent = toastApi?.Toaster ?? null;

    return (
        <ToastContext.Provider value={value}>
            {children}
            {ToasterComponent ? <ToasterComponent position="top-right" /> : null}
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
