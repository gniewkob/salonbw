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
                style={{ color: dark ? 'var(--brand-silver)' : 'var(--brand-silver-ink)', letterSpacing: 'var(--tracking-eyebrow)', fontFamily: "var(--font-open-sans), sans-serif" }}
            >
                {eyebrow}
            </p>
            <Tag
                className="text-3xl md:text-4xl font-bold"
                style={{ fontFamily: "var(--font-playfair), serif", color: dark ? 'var(--brand-white)' : 'var(--brand-black)' }}
            >
                {title}
            </Tag>
            <div className={isLeft ? 'mt-4' : 'mx-auto mt-4'} style={{ width: '40px', height: '2px', background: 'var(--brand-silver)' }} />
            {subtitle && (
                <p
                    className={`text-base mt-5 max-w-lg ${isLeft ? '' : 'mx-auto'}`}
                    style={{ color: dark ? 'var(--white-label)' : 'var(--brand-warm-muted)', lineHeight: 1.8, fontFamily: "var(--font-open-sans), sans-serif" }}
                >
                    {subtitle}
                </p>
            )}
        </div>
    );
}
