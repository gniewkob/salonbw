import type { ReactNode } from 'react';

interface EmptyStateProps {
    /**
     * Optional icon shown above the title. Pass a Heroicon component (e.g.
     * `<UsersIcon style={{ width: 48, height: 48 }} />`) or any other JSX.
     * Renders muted by default.
     */
    icon?: ReactNode;
    /** Primary headline — short and plain. */
    title: string;
    /** Helper text below the title. Single sentence is best. */
    description?: string;
    /** Optional call-to-action JSX (typically a button or link). */
    action?: ReactNode;
    /** Optional inline-style override on the outer wrapper. */
    compact?: boolean;
}

export default function EmptyState({
    icon,
    title,
    description,
    action,
    compact = false,
}: EmptyStateProps) {
    return (
        <div
            role="status"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: compact ? '1.5rem 1rem' : '2.5rem 1.25rem',
                textAlign: 'center',
                color: '#4a4a4a',
            }}
        >
            {icon ? (
                <span
                    aria-hidden
                    style={{
                        color: '#9ca3af',
                        marginBottom: '0.25rem',
                        display: 'inline-flex',
                    }}
                >
                    {icon}
                </span>
            ) : null}
            <p
                style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#1a1a1a',
                }}
            >
                {title}
            </p>
            {description ? (
                <p
                    style={{
                        margin: 0,
                        fontSize: '0.875rem',
                        color: '#6c757d',
                        maxWidth: 360,
                    }}
                >
                    {description}
                </p>
            ) : null}
            {action ? (
                <div style={{ marginTop: '0.75rem' }}>{action}</div>
            ) : null}
        </div>
    );
}
