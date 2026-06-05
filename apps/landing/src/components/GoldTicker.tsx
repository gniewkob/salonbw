import { useLanguage } from '@/contexts/LanguageContext';

export default function GoldTicker() {
    const { T } = useLanguage();
    const doubled = [...T.ticker, ...T.ticker];

    return (
        <div className="gold-ticker" aria-hidden="true">
            <div className="gold-ticker__track">
                {doubled.map((item, i) => (
                    <span key={i} className="gold-ticker__item">
                        {item} <span className="gold-ticker__dot">·</span>
                    </span>
                ))}
            </div>
        </div>
    );
}
