'use client';

import Link from 'next/link';

export interface CalendarViewDraft {
    id: string;
    name: string;
    employeeIds: number[];
    employeeNames: string[];
}

type Props = {
    drafts: CalendarViewDraft[];
    onClose: () => void;
};

export default function ManageCalendarViewsModal({ drafts, onClose }: Props) {
    const hasDrafts = drafts.length > 0;

    return (
        <div className="modal-backdrop fade in" onClick={onClose}>
            <div
                className="modal-dialog"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="modal-content">
                    <div className="modal-header">
                        <button
                            type="button"
                            className="close"
                            onClick={onClose}
                            aria-label="Zamknij"
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title">Zarządzaj widokami</h4>
                    </div>

                    <div className="modal-body modal-body-scroll">
                        {!hasDrafts ? (
                            <div className="bigger">
                                Brak zdefiniowanych widoków
                            </div>
                        ) : (
                            <div className="calendar-view-drafts">
                                {drafts.map((draft) => (
                                    <div
                                        key={draft.id}
                                        className="calendar-view-drafts__item"
                                    >
                                        <div className="calendar-view-drafts__title">
                                            {draft.name}
                                        </div>
                                        <div className="calendar-view-drafts__meta">
                                            {draft.employeeNames.join(', ')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <Link
                            href="/calendar/views/new"
                            className="btn btn-primary"
                        >
                            Utwórz nowy widok
                        </Link>
                        <button
                            type="button"
                            className="btn btn-default"
                            onClick={onClose}
                        >
                            zamknij
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
