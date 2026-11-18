interface SectionHeaderProps {
    eyebrow: string;
    title: string;
    subtitle?: string;
    dark?: boolean;
    align?: 'center' | 'left';
    as?: 'h1' | 'h2';
}

/**
 * Editorial section header shared across the landing — same voice as the
 * homepage chapters: wide-tracked eyebrow, large tight Playfair title.
 * Colours/fonts come from @salonbw/brand-tokens (docs/BRAND_UNIFICATION_PLAN.md).
 */
export default function SectionHeader({ eyebrow, title, subtitle, dark = false, align = 'center', as: Tag = 'h2' }: SectionHeaderProps) {
    const isLeft = align === 'left';
    return (
        <div className={isLeft ? 'mb-14' : 'text-center mb-14'}>
            <p
                className="uppercase mb-4"
                style={{
                    // warm-label: 5.5:1 on --brand-warm-bg too (silver-ink was 4.48:1 there)
                    color: dark ? 'var(--brand-silver-on-dark)' : 'var(--brand-warm-label)',
                    font: '700 0.72rem/1.5 var(--font-body)',
                    letterSpacing: 'var(--tracking-eyebrow)',
                }}
            >
                {eyebrow}
            </p>
            <Tag
                style={{
                    margin: 0,
                    font: '700 clamp(2.25rem, 4.4vw, 4rem)/1.04 var(--font-display)',
                    letterSpacing: '-0.04em',
                    color: dark ? 'var(--brand-white)' : 'var(--brand-black)',
                }}
            >
                {title}
            </Tag>
            {subtitle && (
                <p
                    className={`text-base mt-5 max-w-lg ${isLeft ? '' : 'mx-auto'}`}
                    style={{
                        color: dark ? 'var(--white-label)' : 'var(--brand-warm-muted)',
                        lineHeight: 1.8,
                        fontFamily: 'var(--font-body)',
                    }}
                >
                    {subtitle}
                </p>
            )}
        </div>
    );
}
