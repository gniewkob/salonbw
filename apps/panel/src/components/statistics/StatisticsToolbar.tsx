interface StatisticsToolbarProps {
    date: string;
    dateLabel?: string;
    onPrev: () => void;
    onNext: () => void;
    onDateChange: (value: string) => void;
    onPrint?: () => void;
    onExcel?: () => void;
    onPdf?: () => void;
    excelDisabled?: boolean;
    pdfDisabled?: boolean;
    excelLabel?: string;
    pdfLabel?: string;
}

export default function StatisticsToolbar({
    date,
    dateLabel = 'Data',
    onPrev,
    onNext,
    onDateChange,
    onPrint,
    onExcel,
    onPdf,
    excelDisabled = false,
    pdfDisabled = false,
    excelLabel = 'pobierz raport Excel',
    pdfLabel = 'pobierz raport PDF',
}: StatisticsToolbarProps) {
    return (
        <div className="actions statistics-toolbar">
            <div className="statistics-toolbar__left">
                <div className="pull-left statistics_date">
                    <button
                        type="button"
                        className="button button-link button_prev mr-s"
                        onClick={onPrev}
                        aria-label="Poprzedni dzień"
                    >
                        <span
                            className="fc-icon fc-icon-left-single-arrow"
                            aria-hidden="true"
                        />
                    </button>
                    <div id="choose_date">
                        <form
                            className="date_range_box"
                            onSubmit={(event) => event.preventDefault()}
                        >
                            <input
                                id="date_range"
                                name="date_range"
                                type="text"
                                readOnly
                                value={date}
                                aria-label={dateLabel}
                            />
                            <input
                                type="date"
                                className="statistics-date-picker-hidden"
                                value={date}
                                aria-label={dateLabel}
                                onChange={(event) =>
                                    onDateChange(event.target.value)
                                }
                            />
                        </form>
                    </div>
                    <button
                        type="button"
                        className="button button-link button_next ml-s"
                        onClick={onNext}
                        aria-label="Następny dzień"
                    >
                        <span
                            className="fc-icon fc-icon-right-single-arrow"
                            aria-hidden="true"
                        />
                    </button>
                </div>
            </div>
            <div className="statistics-toolbar__right">
                {onExcel ? (
                    <button
                        type="button"
                        className="button"
                        onClick={onExcel}
                        disabled={excelDisabled}
                    >
                        <div
                            className="icon sprite-exel_blue mr-xs"
                            aria-hidden="true"
                        />
                        {excelLabel}
                    </button>
                ) : null}
                {onPdf ? (
                    <button
                        type="button"
                        className="button ml-s"
                        onClick={onPdf}
                        disabled={pdfDisabled}
                    >
                        <div
                            className="icon sprite-pdf_blue mr-xs"
                            style={{ display: 'inline-block', width: '16px', height: '16px', backgroundColor: '#e74c3c' }}
                            aria-hidden="true"
                        />
                        {pdfLabel}
                    </button>
                ) : null}
                {onPrint ? (
                    <button
                        type="button"
                        className="button button-link statistics-print-button"
                        onClick={onPrint}
                        aria-label="Drukuj"
                    >
                        <div
                            className="icon sprite-print_blue"
                            aria-hidden="true"
                        />
                    </button>
                ) : null}
            </div>
        </div>
    );
}
