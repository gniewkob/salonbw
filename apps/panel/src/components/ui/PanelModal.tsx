import type { ReactNode } from 'react';

type PanelModalProps = {
    title: ReactNode;
    children: ReactNode;
    maxWidthClassName?: string;
};

export default function PanelModal({
    title,
    children,
    maxWidthClassName = 'max-w-md',
}: PanelModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
                className={`w-full rounded-lg bg-white shadow-xl ${maxWidthClassName}`.trim()}
            >
                <div className="p-6">
                    <h2 className="mb-4 text-xl font-semibold">{title}</h2>
                    {children}
                </div>
            </div>
        </div>
    );
}
