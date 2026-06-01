interface SectionHeaderProps {
    eyebrow: string;
    title: string;
    subtitle?: string;
    dark?: boolean;
    align?: 'center' | 'left';
    as?: 'h1' | 'h2';
}

export default function SectionHeader({ eyebrow, title, subtitle, dark = false, align = 'center', as: Tag = 'h2' }: SectionHeaderProps) {
    const isLeft = align === 'left';
    return (
        <div className={isLeft ? 'mb-14' : 'text-center mb-14'}>
            <p
                className="text-xs uppercase mb-3"
                style={{ color: '#b8bcc8', letterSpacing: '0.12em', fontFamily: "var(--font-open-sans), sans-serif" }}
            >
                {eyebrow}
            </p>
            <Tag
                className="text-3xl md:text-4xl font-bold"
                style={{ fontFamily: "var(--font-playfair), serif", color: dark ? '#ffffff' : '#0d0d0d' }}
            >
                {title}
            </Tag>
            <div className={isLeft ? 'mt-4' : 'mx-auto mt-4'} style={{ width: '40px', height: '2px', background: '#b8bcc8' }} />
            {subtitle && (
                <p
                    className={`text-sm mt-5 max-w-lg ${isLeft ? '' : 'mx-auto'}`}
                    style={{ color: dark ? 'rgba(255,255,255,0.55)' : '#8a7060', lineHeight: 1.8, fontFamily: "var(--font-open-sans), sans-serif" }}
                >
                    {subtitle}
                </p>
            )}
        </div>
    );
}
