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
        <div className="position-fixed top-0 start-0 bottom-0 end-0 d-flex align-items-center justify-content-center bg-dark bg-opacity-50">
            <div
                className={`w-100 rounded-3 bg-white shadow-xl ${maxWidthClassName}`.trim()}
            >
                <div className="p-4">
                    <h2 className="mb-3 fs-5 fw-semibold">{title}</h2>
                    {children}
                </div>
            </div>
        </div>
    );
}
