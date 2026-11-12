import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import V18DateInput from '@/components/ui/V18DateInput';
import { normalizeDateInputLanguage } from '@/utils/dateInputLocale';

type MockHeaderProps = {
    date: Date;
    changeMonth: (month: number) => void;
    changeYear: (year: number) => void;
    decreaseMonth: () => void;
    increaseMonth: () => void;
    prevMonthButtonDisabled: boolean;
    nextMonthButtonDisabled: boolean;
};

jest.mock('react-datepicker', () => ({
    __esModule: true,
    default: ({
        onChange,
        locale,
        dateFormat,
        selected,
        showTimeSelect,
        showMonthDropdown,
        showYearDropdown,
        timeCaption,
        renderCustomHeader,
    }: {
        onChange: (date: Date | null) => void;
        locale: { code: string };
        dateFormat: string;
        selected?: Date | null;
        showTimeSelect?: boolean;
        showMonthDropdown?: boolean;
        showYearDropdown?: boolean;
        timeCaption?: string;
        renderCustomHeader?: (props: MockHeaderProps) => ReactNode;
    }) => (
        <div
            data-testid="date-picker"
            data-locale={locale.code}
            data-format={dateFormat}
            data-show-time={String(Boolean(showTimeSelect))}
            data-default-month={String(Boolean(showMonthDropdown))}
            data-default-year={String(Boolean(showYearDropdown))}
            data-time-caption={timeCaption}
        >
            {renderCustomHeader?.({
                date: selected ?? new Date(2026, 10, 6),
                changeMonth: jest.fn(),
                changeYear: jest.fn(),
                decreaseMonth: jest.fn(),
                increaseMonth: jest.fn(),
                prevMonthButtonDisabled: false,
                nextMonthButtonDisabled: false,
            })}
            <button
                type="button"
                onClick={() => onChange(new Date(1990, 4, 10, 14, 30))}
            >
                Select date
            </button>
        </div>
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
            expect(screen.getByTestId('date-picker')).toHaveAttribute(
                'data-locale',
                'pl',
            ),
        );
        expect(screen.getByRole('combobox', { name: 'Miesiąc' })).toBeVisible();
        expect(screen.getByRole('combobox', { name: 'Rok' })).toBeVisible();

        act(() => {
            document.documentElement.lang = 'de-DE';
        });
        await waitFor(() =>
            expect(screen.getByTestId('date-picker')).toHaveAttribute(
                'data-locale',
                'de',
            ),
        );
        expect(screen.getByRole('combobox', { name: 'Monat' })).toBeVisible();
        expect(screen.getByRole('combobox', { name: 'Jahr' })).toBeVisible();

        act(() => {
            document.documentElement.lang = 'en-GB';
        });
        await waitFor(() =>
            expect(screen.getByTestId('date-picker')).toHaveAttribute(
                'data-locale',
                'en-GB',
            ),
        );
        expect(screen.getByRole('combobox', { name: 'Month' })).toBeVisible();
        expect(screen.getByRole('combobox', { name: 'Year' })).toBeVisible();
    });

    it('renders one month and year control for birthdays', () => {
        const onChange = jest.fn();
        render(
            <V18DateInput
                id="birthday"
                mode="date"
                value=""
                onChange={onChange}
                language="pl"
            />,
        );

        const picker = screen.getByTestId('date-picker');
        expect(within(picker).getAllByRole('combobox')).toHaveLength(2);
        expect(picker).toHaveAttribute('data-default-month', 'false');
        expect(picker).toHaveAttribute('data-default-year', 'false');
        expect(picker).toHaveAttribute('data-show-time', 'false');
        fireEvent.click(within(picker).getByRole('combobox', { name: 'Rok' }));
        expect(
            within(picker).getByRole('option', { name: '1990' }),
        ).toBeInTheDocument();
        fireEvent.click(
            within(picker).getByRole('button', { name: 'Select date' }),
        );
        expect(onChange).toHaveBeenCalledWith('1990-05-10');
    });

    it('keeps date-range fields date-only with local ISO output', () => {
        const onChange = jest.fn();
        render(
            <V18DateInput
                id="customer-history-from"
                mode="date"
                purpose="range"
                value="2026-01-09"
                onChange={onChange}
                language="en"
            />,
        );
        const picker = screen.getByTestId('date-picker');
        expect(picker).toHaveAttribute('data-show-time', 'false');
        fireEvent.click(
            within(picker).getByRole('button', { name: 'Select date' }),
        );
        expect(onChange).toHaveBeenCalledWith('1990-05-10');
    });

    it('does not bubble Escape from the picker to an enclosing modal', () => {
        const documentKeydown = jest.fn();
        document.addEventListener('keydown', documentKeydown);
        try {
            render(
                <V18DateInput
                    id="birthday-escape"
                    mode="date"
                    value=""
                    onChange={jest.fn()}
                />,
            );
            fireEvent.keyDown(screen.getByTestId('date-picker'), {
                key: 'Escape',
            });
            expect(documentKeydown).not.toHaveBeenCalled();
        } finally {
            document.removeEventListener('keydown', documentKeydown);
        }
    });

    it('keeps a single localized header with independent time and ISO-local output', () => {
        const onChange = jest.fn();
        render(
            <V18DateInput
                id="start"
                mode="datetime"
                value=""
                onChange={onChange}
                language="de"
            />,
        );
        const picker = screen.getByTestId('date-picker');
        expect(within(picker).getAllByRole('combobox')).toHaveLength(2);
        expect(picker).toHaveAttribute('data-default-month', 'false');
        expect(picker).toHaveAttribute('data-default-year', 'false');
        expect(picker).toHaveAttribute('data-show-time', 'false');
        expect(screen.getByRole('button', { name: 'Uhrzeit' })).toBeVisible();
        expect(picker).toHaveAttribute('data-time-caption', 'Uhrzeit');
        fireEvent.click(
            within(picker).getByRole('button', { name: 'Select date' }),
        );
        expect(onChange).toHaveBeenCalledWith('1990-05-10T14:30');
    });

    it('preserves the booked local time when selecting a different day', () => {
        const onChange = jest.fn();
        render(
            <V18DateInput
                id="start"
                mode="datetime"
                value="2026-11-07T13:40"
                onChange={onChange}
                language="pl"
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Select date' }));
        expect(onChange).toHaveBeenCalledWith('1990-05-10T13:40');
    });

    it('offers compact hour and minute chips without a vertical time list', () => {
        const onChange = jest.fn();
        render(
            <V18DateInput
                id="start"
                mode="datetime"
                value="2026-11-07T14:30"
                onChange={onChange}
                language="pl"
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Godzina' }));
        expect(
            screen.getByRole('dialog', { name: 'Wybierz godzinę' }),
        ).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: '16' }));
        expect(onChange).toHaveBeenCalledWith('2026-11-07T16:30');
    });
});
