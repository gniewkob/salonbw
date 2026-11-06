import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import V18DateInput from '@/components/ui/V18DateInput';
import { normalizeDateInputLanguage } from '@/utils/dateInputLocale';

jest.mock('react-datepicker', () => ({
    __esModule: true,
    default: ({
        onChange,
        locale,
        dateFormat,
        showTimeSelect,
        showYearDropdown,
        showMonthDropdown,
        value,
    }: {
        onChange: (date: Date | null) => void;
        locale: { code: string };
        dateFormat: string;
        showTimeSelect: boolean;
        showYearDropdown: boolean;
        showMonthDropdown: boolean;
        value?: string;
    }) => (
        <button
            type="button"
            data-testid="date-input"
            data-locale={locale.code}
            data-format={dateFormat}
            data-show-time={String(showTimeSelect)}
            data-show-year={String(showYearDropdown)}
            data-show-month={String(showMonthDropdown)}
            data-value={value}
            onClick={() => onChange(new Date(1990, 4, 10, 14, 30))}
        >
            Select date
        </button>
    ),
}));

const originalLang = document.documentElement.lang;

afterEach(() => {
    document.documentElement.lang = originalLang;
});

describe('V18 date input localization', () => {
    it('normalizes locale tags and handles unsupported languages', () => {
        expect(normalizeDateInputLanguage('pl-PL')).toBe('pl');
        expect(normalizeDateInputLanguage('de-DE')).toBe('de');
        expect(normalizeDateInputLanguage('en_GB')).toBe('en');
        expect(normalizeDateInputLanguage('es-ES')).toBe('pl');
    });

    it('updates date locale when interface language changes', async () => {
        document.documentElement.lang = 'pl-PL';
        render(
            <V18DateInput
                id="birthday"
                mode="date"
                value=""
                onChange={jest.fn()}
            />,
        );
        await waitFor(() =>
            expect(screen.getByTestId('date-input')).toHaveAttribute(
                'data-locale',
                'pl',
            ),
        );

        act(() => {
            document.documentElement.lang = 'de-DE';
        });
        await waitFor(() =>
            expect(screen.getByTestId('date-input')).toHaveAttribute(
                'data-locale',
                'de',
            ),
        );

        act(() => {
            document.documentElement.lang = 'en-GB';
        });
        await waitFor(() =>
            expect(screen.getByTestId('date-input')).toHaveAttribute(
                'data-locale',
                'en-GB',
            ),
        );
    });

    it('stores birthday date only in ISO date format', () => {
        const onChange = jest.fn();
        render(
            <V18DateInput
                id="birthday"
                mode="date"
                value=""
                onChange={onChange}
                language="de"
            />,
        );

        expect(screen.getByTestId('date-input')).toHaveAttribute(
            'data-show-time',
            'false',
        );
        expect(screen.getByTestId('date-input')).toHaveAttribute(
            'data-show-year',
            'true',
        );
        expect(screen.getByTestId('date-input')).toHaveAttribute(
            'data-show-month',
            'true',
        );
        fireEvent.click(screen.getByTestId('date-input'));
        expect(onChange).toHaveBeenCalledWith('1990-05-10');
    });

    it('preserves a locale-neutral appointment time value', () => {
        const onChange = jest.fn();
        render(
            <V18DateInput
                id="start"
                mode="datetime"
                value=""
                onChange={onChange}
                language="en"
            />,
        );

        expect(screen.getByTestId('date-input')).toHaveAttribute(
            'data-show-time',
            'true',
        );
        fireEvent.click(screen.getByTestId('date-input'));
        expect(onChange).toHaveBeenCalledWith('1990-05-10T14:30');
    });
});
