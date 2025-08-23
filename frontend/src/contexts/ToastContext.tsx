import { createContext, useContext } from 'react';
import { Toaster, toast } from 'react-hot-toast';

interface ToastContextValue {
    success: (msg: string) => void;
    error: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
    success: () => {},
    error: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
    return (
        <ToastContext.Provider
            value={{ success: toast.success, error: toast.error }}
        >
            {children}
            <Toaster position="top-right" />
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
