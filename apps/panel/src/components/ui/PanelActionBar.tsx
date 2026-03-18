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
                className={`form-actions flex items-center gap-3 ${className ?? ''}`.trim()}
            >
                {secondary ? <div>{secondary}</div> : null}
                <div className="flex items-center gap-2 ml-auto">{primary}</div>
            </div>
        </>
    );
}
