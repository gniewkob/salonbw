'use client';

interface Props {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    icon?: React.ReactNode;
    color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const COLOR_CLASSES = {
    default: 'bg-white',
    primary: 'bg-primary-50 border-primary-100',
    success: 'bg-green-50 border-green-100',
    warning: 'bg-yellow-50 border-yellow-100',
    danger: 'bg-red-50 border-red-100',
};

const ICON_COLOR_CLASSES = {
    default: 'text-secondary',
    primary: 'text-primary-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
};

export default function KpiCard({
    title,
    value,
    subtitle,
    trend,
    icon,
    color = 'default',
}: Props) {
    const displayValue =
        typeof value === 'number'
            ? value.toLocaleString('pl-PL', { minimumFractionDigits: 0 })
            : value;

    return (
        <div
            className={`rounded-3 border p-3 shadow-sm ${COLOR_CLASSES[color]}`}
        >
            <div className="d-flex align-items-start justify-content-between">
                <div className="flex-fill">
                    <p className="small fw-medium text-muted">{title}</p>
                    <p className="mt-1 fs-3 fw-bold text-dark">
                        {displayValue}
                    </p>
                    {subtitle && (
                        <p className="mt-1 small text-muted">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="mt-2 d-flex align-items-center gap-1">
                            <span
                                className={`small fw-medium ${
                                    trend.isPositive
                                        ? 'text-success'
                                        : 'text-danger'
                                }`}
                            >
                                {trend.isPositive ? '+' : ''}
                                {trend.value}%
                            </span>
                            <svg
                                className={`w-4 h-4 ${
                                    trend.isPositive
                                        ? 'text-success'
                                        : 'text-danger rotate-180'
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                                />
                            </svg>
                        </div>
                    )}
                </div>
                {icon && (
                    <div
                        className={`p-2 rounded-3 bg-white/50 ${ICON_COLOR_CLASSES[color]}`}
                    >
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
