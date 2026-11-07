import DatePicker from 'react-datepicker';
import { format, isValid, parseISO } from 'date-fns';
import { useDateInputLocale } from '@/hooks/useDateInputLocale';
import V18Select from '@/components/ui/V18Select';
import { dateInputPlaceholder } from '@/utils/dateInputLocale';
import styles from '@/styles/V18DateInput.module.css';

type Props = {
    id: string;
    value: string;
    onChange: (value: string) => void;
    mode: 'date' | 'datetime';
    purpose?: 'birthday' | 'range';
    disabled?: boolean;
    className?: string;
    /** Optional override for a future application-level language selector. */
    language?: string;
};

const DATE_FORMAT = 'yyyy-MM-dd';
const DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm";

function parseLocalValue(value: string): Date | null {
    if (!value) return null;
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
}

/**
 * Shared V18 calendar UI for birthdays and appointment dates.
 * UI labels/months use the interface locale; output stays locale-neutral:
 * yyyy-MM-dd for CRM birthdays and yyyy-MM-ddTHH:mm for appointments.
 * Existing timezone conversions remain in AppointmentDrawer.
 */
export default function V18DateInput({
    id,
    value,
    onChange,
    mode,
    purpose = 'birthday',
    disabled = false,
    className,
    language,
}: Props) {
    const { language: resolvedLanguage, locale } = useDateInputLocale(language);
    const dateOnly = mode === 'date';
    const birthday = dateOnly && purpose === 'birthday';
    const labels = {
        pl: {
            month: 'Miesiąc',
            year: 'Rok',
            previous: 'Poprzedni miesiąc',
            next: 'Następny miesiąc',
            time: 'Godzina',
        },
        de: {
            month: 'Monat',
            year: 'Jahr',
            previous: 'Vorheriger Monat',
            next: 'Nächster Monat',
            time: 'Uhrzeit',
        },
        en: {
            month: 'Month',
            year: 'Year',
            previous: 'Previous month',
            next: 'Next month',
            time: 'Time',
        },
    }[resolvedLanguage];
    const todayYear = new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, index) =>
        format(new Date(2024, index, 1), 'LLLL', { locale }),
    );

    return (
        <div
            className={styles.field}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
                // Escape closes the picker, never the enclosing customer modal.
                if (event.key === 'Escape') event.stopPropagation();
            }}
        >
            <DatePicker
                id={id}
                selected={parseLocalValue(value)}
                onChange={(date: Date | null) => {
                    onChange(
                        date
                            ? format(
                                  date,
                                  dateOnly ? DATE_FORMAT : DATETIME_FORMAT,
                              )
                            : '',
                    );
                }}
                locale={locale}
                dateFormat={dateOnly ? 'P' : 'Pp'}
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption={labels.time}
                showTimeSelect={!dateOnly}
                renderCustomHeader={({
                    date,
                    changeMonth,
                    changeYear,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                }) => {
                    const firstYear = birthday
                        ? 1900
                        : Math.min(todayYear - 20, date.getFullYear());
                    const lastYear = birthday
                        ? todayYear
                        : Math.max(todayYear + 10, date.getFullYear());

                    return (
                        <div className={styles.monthHeader}>
                            <button
                                type="button"
                                className={styles.monthArrow}
                                onClick={decreaseMonth}
                                disabled={prevMonthButtonDisabled}
                                aria-label={labels.previous}
                            >
                                ‹
                            </button>
                            <V18Select
                                ariaLabel={labels.month}
                                value={String(date.getMonth())}
                                options={months.map((name, index) => ({
                                    value: String(index),
                                    label: name,
                                }))}
                                onChange={(month) => changeMonth(Number(month))}
                                className={styles.monthSelect}
                            />
                            <V18Select
                                ariaLabel={labels.year}
                                value={String(date.getFullYear())}
                                options={Array.from(
                                    { length: lastYear - firstYear + 1 },
                                    (_, index) => {
                                        const year = firstYear + index;
                                        return {
                                            value: String(year),
                                            label: String(year),
                                        };
                                    },
                                )}
                                onChange={(year) => changeYear(Number(year))}
                                className={styles.yearSelect}
                            />
                            <button
                                type="button"
                                className={styles.monthArrow}
                                onClick={increaseMonth}
                                disabled={nextMonthButtonDisabled}
                                aria-label={labels.next}
                            >
                                ›
                            </button>
                        </div>
                    );
                }}
                minDate={birthday ? new Date(1900, 0, 1) : undefined}
                maxDate={birthday ? new Date() : undefined}
                isClearable={dateOnly}
                disabled={disabled}
                className={[styles.input, className].filter(Boolean).join(' ')}
                calendarClassName={styles.calendar}
                popperClassName={styles.popper}
                portalId="salonbw-v18-date-picker-portal"
                showPopperArrow={false}
                placeholderText={dateInputPlaceholder[resolvedLanguage][mode]}
                shouldCloseOnSelect={dateOnly}
                autoComplete="off"
            />
        </div>
    );
}
