interface VersumIconProps {
    id: string;
    className?: string;
}

export default function VersumIcon({ id, className }: VersumIconProps) {
    return (
        <svg
            aria-hidden="true"
            focusable="false"
            className={className ?? 'versum-icon'}
        >
            <use href={`#${id}`} />
        </svg>
    );
}
