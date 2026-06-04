import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

type ToastModule = typeof import('react-hot-toast');

interface ToastContextValue {
    success: (msg: string) => void;
    error: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
    success: () => {},
    error: () => {},
});

const shouldEagerLoadToast =
    typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

function loadToastModuleSync(): ToastModule | null {
    if (!shouldEagerLoadToast) {
        return null;
    }
    try {
        // eslint-disable-next-line global-require
        return require('react-hot-toast') as ToastModule;
    } catch {
        return null;
    }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toastApi, setToastApi] = useState<ToastModule | null>(() =>
        loadToastModuleSync(),
    );
    const pendingRef = useRef<{ type: 'success' | 'error'; message: string }[]>(
        [],
    );

    useEffect(() => {
        if (toastApi) {
            return;
        }
        let mounted = true;
        import('react-hot-toast')
            .then((mod) => {
                if (mounted) {
                    setToastApi(mod);
                }
            })
            .catch((err) => {
                console.warn('Failed to load toast module', err);
            });
        return () => {
            mounted = false;
        };
    }, [toastApi]);

    const value = useMemo<ToastContextValue>(() => {
        const enqueue = (type: 'success' | 'error', message: string) => {
            if (toastApi) {
                toastApi.toast[type](message);
                return;
            }
            pendingRef.current.push({ type, message });
        };
        return {
            success: (msg) => enqueue('success', msg),
            error: (msg) => enqueue('error', msg),
        };
    }, [toastApi]);

    useEffect(() => {
        if (!toastApi || pendingRef.current.length === 0) {
            return;
        }
        const pending = pendingRef.current.splice(0, pendingRef.current.length);
        for (const item of pending) {
            toastApi.toast[item.type](item.message);
        }
    }, [toastApi]);

    const ToasterComponent = toastApi?.Toaster ?? null;

    return (
        <ToastContext.Provider value={value}>
            {children}
            {ToasterComponent ? (
                <ToasterComponent
                    position="top-right"
                    toastOptions={{
                        duration: 3500,
                        style: {
                            background: '#0d0d0d',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 6,
                            padding: '0.625rem 0.875rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            letterSpacing: '0.01em',
                            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.18)',
                            maxWidth: 360,
                        },
                        success: {
                            iconTheme: {
                                primary: '#b4b8be',
                                secondary: '#0d0d0d',
                            },
                        },
                        error: {
                            style: {
                                background: '#842029',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                            },
                            iconTheme: {
                                primary: '#ffffff',
                                secondary: '#842029',
                            },
                        },
                    }}
                    containerStyle={{
                        top: 'calc(env(safe-area-inset-top) + 4rem)',
                        right: '1rem',
                    }}
                />
            ) : null}
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
