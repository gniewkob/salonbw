import type { ReactNode } from 'react';

export type StatusBadgeTone =
    | 'attention'
    | 'danger'
    | 'info'
    | 'neutral'
    | 'success';

type StatusBadgeProps = {
    children: ReactNode;
    className?: string;
    tone?: StatusBadgeTone;
};

export default function StatusBadge({
    children,
    className,
    tone = 'neutral',
}: StatusBadgeProps) {
    return (
        <span
            className={[
                'panel-status-badge',
                `panel-status-badge--${tone}`,
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            {children}
        </span>
    );
}
