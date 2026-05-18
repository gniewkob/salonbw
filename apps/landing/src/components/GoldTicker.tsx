const ITEMS = [
    'PASJA', 'PROFESJONALIZM', 'PIELĘGNACJA', 'PIĘKNO',
    'BYTOM', 'AKADEMIA', 'ZDROWE WŁOSY', 'BLACK & WHITE',
    'KERASTASE', 'OLAPLEX', 'NIOXIN', 'WELLA',
];

export default function GoldTicker() {
    const doubled = [...ITEMS, ...ITEMS];
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
