interface SalonBWIconProps {
    id: string;
    className?: string;
}

export default function SalonBWIcon({ id, className }: SalonBWIconProps) {
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
