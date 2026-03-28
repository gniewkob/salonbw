interface SalonIconProps {
    id: string;
    className?: string;
}

export default function SalonIcon({ id, className }: SalonIconProps) {
    return (
        <svg
            aria-hidden="true"
            focusable="false"
            className={className ?? 'salonbw-icon'}
        >
            <use href={`#${id}`} />
        </svg>
    );
}
