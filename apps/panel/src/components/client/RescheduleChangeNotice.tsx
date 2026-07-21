function formatRescheduleDateTime(value: string) {
    return new Date(value).toLocaleString('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

type RescheduleChangeNoticeProps = {
    compact?: boolean;
    newStartTime: string;
    previousStartTime?: string | null;
};

export default function RescheduleChangeNotice({
    compact = false,
    newStartTime,
    previousStartTime,
}: RescheduleChangeNoticeProps) {
    if (!previousStartTime) return null;

    return (
        <div
            className={[
                'reschedule-change',
                compact ? 'reschedule-change--compact' : '',
            ]
                .filter(Boolean)
                .join(' ')}
            role="note"
        >
            <div className="reschedule-change__title">
                Salon proponuje zmianę terminu
            </div>
            <div className="reschedule-change__grid">
                <div>
                    <span>Było</span>
                    <strong>
                        {formatRescheduleDateTime(previousStartTime)}
                    </strong>
                </div>
                <div>
                    <span>Propozycja salonu</span>
                    <strong>{formatRescheduleDateTime(newStartTime)}</strong>
                </div>
            </div>
        </div>
    );
}
