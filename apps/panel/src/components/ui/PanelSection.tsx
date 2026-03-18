import type { ReactNode } from 'react';

type PanelSectionProps = {
    title?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
};

export default function PanelSection({
    title,
    action,
    children,
    className,
}: PanelSectionProps) {
    return (
        <div
            className={`inner edit_branch_form${className ? ` ${className}` : ''}`}
        >
            {action ? <div className="actions">{action}</div> : null}
            {title ? <h2>{title}</h2> : null}
            {children}
        </div>
    );
}
