import ScrollReveal from './ScrollReveal';

const stats = [
    { number: '30+', label: 'lat doświadczenia' },
    { number: '2011', label: 'rok założenia' },
    { number: '5', label: 'kluczowych wartości' },
    { number: '5★', label: 'ocena klientek' },
];

export default function StatsBar() {
    return (
        <section className="stats-bar" aria-label="Liczby o salonie">
            <div className="stats-bar__inner">
                {stats.map(({ number, label }, i) => (
                    <ScrollReveal key={label} delay={i * 80} direction="up">
                        <div className="stats-bar__item">
                            <span className="stats-bar__number">{number}</span>
                            <span className="stats-bar__label">{label}</span>
                        </div>
                    </ScrollReveal>
                ))}
            </div>
        </section>
    );
}
