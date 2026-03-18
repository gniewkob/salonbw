import type { ReactNode } from 'react';

type PanelActionBarProps = {
    primary: ReactNode;
    secondary?: ReactNode;
    className?: string;
};

export default function PanelActionBar({
    primary,
    secondary,
    className,
}: PanelActionBarProps) {
    return (
        <>
            <div className="form-actions-prev" />
            <div
                className={`form-actions flex items-center justify-between gap-3 ${className ?? ''}`.trim()}
            >
                <div>{secondary ?? <span />}</div>
                <div className="flex items-center gap-2">{primary}</div>
            </div>
        </>
    );
}
