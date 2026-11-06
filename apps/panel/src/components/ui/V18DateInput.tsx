import DatePicker from 'react-datepicker';
import { format, isValid, parseISO } from 'date-fns';
import { useDateInputLocale } from '@/hooks/useDateInputLocale';
import { dateInputPlaceholder } from '@/utils/dateInputLocale';
import styles from '@/styles/V18DateInput.module.css';

type Props = {
    id: string;
    value: string;
    onChange: (value: string) => void;
    mode: 'date' | 'datetime';
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
    disabled = false,
    className,
    language,
}: Props) {
    const { language: resolvedLanguage, locale } = useDateInputLocale(language);
    const birthday = mode === 'date';

    return (
        <div
            className={styles.field}
            onClick={(event) => event.stopPropagation()}
        >
            <DatePicker
                id={id}
                selected={parseLocalValue(value)}
                onChange={(date: Date | null) => {
                    onChange(
                        date
                            ? format(
                                  date,
                                  birthday ? DATE_FORMAT : DATETIME_FORMAT,
                              )
                            : '',
                    );
                }}
                locale={locale}
                dateFormat={birthday ? 'P' : 'Pp'}
                timeFormat="HH:mm"
                timeIntervals={15}
                showTimeSelect={!birthday}
                showMonthDropdown
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={birthday ? 120 : 20}
                minDate={birthday ? new Date(1900, 0, 1) : undefined}
                maxDate={birthday ? new Date() : undefined}
                isClearable={birthday}
                disabled={disabled}
                className={[styles.input, className].filter(Boolean).join(' ')}
                calendarClassName={styles.calendar}
                popperClassName={styles.popper}
                portalId="salonbw-v18-date-picker-portal"
                showPopperArrow={false}
                placeholderText={dateInputPlaceholder[resolvedLanguage][mode]}
                shouldCloseOnSelect={birthday}
                autoComplete="off"
            />
        </div>
    );
}
