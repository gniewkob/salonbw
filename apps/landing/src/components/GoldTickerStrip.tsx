
const WORDS = ['PASJA', 'PROFESJONALIZM', 'PIELĘGNACJA', 'PIĘKNO', 'BYTOM', 'BLACK & WHITE', 'AKADEMIA', 'ZDROWE WŁOSY', 'OD 2011'];

export default function GoldTickerStrip() {
    const doubled = [...WORDS, ...WORDS];
    return (
        <div className="gold-ticker-strip" aria-hidden="true">
            <div className="gold-ticker-strip__track">
                {doubled.map((word, i) => (
                    <span key={i} className="gold-ticker-strip__item">
                        {word}
                        <span className="gold-ticker-strip__dot"> ·</span>
                    </span>
                ))}
            </div>
        </div>
    );
}
