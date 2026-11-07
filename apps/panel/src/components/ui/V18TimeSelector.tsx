import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/V18DateInput.module.css';

type Props = {
    value: string;
    label: string;
    disabled?: boolean;
    onChange: (value: string) => void;
};

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export default function V18TimeSelector({
    value,
    label,
    disabled = false,
    onChange,
}: Props) {
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const [hours, minutes] = value.split(':');
    const currentHour = HOURS.includes(hours) ? hours : '09';
    const currentMinute = /^\d\d$/.test(minutes ?? '') ? minutes : '00';

    useEffect(() => {
        if (!open) return;
        const outside = (event: PointerEvent) => {
            if (!root.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('pointerdown', outside);
        return () => document.removeEventListener('pointerdown', outside);
    }, [open]);

    const setHour = (hour: string) => onChange(hour + ':' + currentMinute);
    const setMinute = (minute: string) => {
        onChange(currentHour + ':' + minute);
        setOpen(false);
    };

    return (
        <div className={styles.timeField} ref={root}>
            <button
                type="button"
                className={styles.timeTrigger}
                aria-label={label}
                aria-haspopup="dialog"
                aria-expanded={open}
                disabled={disabled}
                onClick={() => setOpen((previous) => !previous)}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        setOpen(false);
                        event.stopPropagation();
                    }
                }}
            >
                <span>{currentHour + ':' + currentMinute}</span>
                <span aria-hidden="true">⌄</span>
            </button>
            {open ? (
                <div
                    role="dialog"
                    aria-label="Wybierz godzinę"
                    className={styles.timePanel}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            setOpen(false);
                            event.stopPropagation();
                        }
                    }}
                >
                    <p className={styles.timeHeading}>Godzina</p>
                    <div className={styles.hourGrid}>
                        {HOURS.map((hour) => (
                            <button
                                key={hour}
                                type="button"
                                className={[
                                    styles.timeChip,
                                    hour === currentHour
                                        ? styles.timeChipSelected
                                        : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                aria-pressed={hour === currentHour}
                                onClick={() => setHour(hour)}
                            >
                                {hour}
                            </button>
                        ))}
                    </div>
                    <p className={styles.timeHeading}>Minuty</p>
                    <div className={styles.minuteGrid}>
                        {MINUTES.map((minute) => (
                            <button
                                key={minute}
                                type="button"
                                className={[
                                    styles.timeChip,
                                    minute === currentMinute
                                        ? styles.timeChipSelected
                                        : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                aria-pressed={minute === currentMinute}
                                onClick={() => setMinute(minute)}
                            >
                                {minute}
                            </button>
                        ))}
                    </div>
                    <label className={styles.timeManual}>
                        <span>Dokładna godzina</span>
                        <input
                            type="time"
                            aria-label="Dokładna godzina"
                            value={currentHour + ':' + currentMinute}
                            step={60}
                            onChange={(event) => {
                                if (
                                    /^([01]\d|2[0-3]):[0-5]\d$/.test(
                                        event.target.value,
                                    )
                                ) {
                                    onChange(event.target.value);
                                }
                            }}
                        />
                    </label>
                </div>
            ) : null}
        </div>
    );
}
