interface SectionHeaderProps {
    eyebrow: string;
    title: string;
    dark?: boolean;
}

export default function SectionHeader({ eyebrow, title, dark = false }: SectionHeaderProps) {
    return (
        <div className="text-center mb-14">
            <p
                className="text-xs uppercase mb-3"
                style={{ color: '#c5a880', letterSpacing: '0.22em', fontFamily: "var(--font-open-sans), sans-serif" }}
            >
                {eyebrow}
            </p>
            <h2
                className="text-3xl md:text-4xl font-bold"
                style={{ fontFamily: "var(--font-playfair), serif", color: dark ? '#ffffff' : '#0d0d0d' }}
            >
                {title}
            </h2>
            <div className="mx-auto mt-4" style={{ width: '40px', height: '2px', background: '#c5a880' }} />
        </div>
    );
}
