'use client';

import Link from 'next/link';
import type { CalendarNamedView } from '@/types';

type Props = {
    views: Array<
        CalendarNamedView & {
            employeeNames: string[];
        }
    >;
    error?: string | null;
    deletingId?: number | null;
    onEdit: (viewId: number) => void;
    onDelete: (viewId: number) => void;
    onClose: () => void;
};

export default function ManageCalendarViewsModal({
    views,
    error,
    deletingId,
    onEdit,
    onDelete,
    onClose,
}: Props) {
    const hasViews = views.length > 0;

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
                        {error ? (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        ) : null}
                        {!hasViews ? (
                            <div className="bigger">
                                Brak zdefiniowanych widoków
                            </div>
                        ) : (
                            <div className="calendar-view-drafts">
                                {views.map((view) => (
                                    <div
                                        key={view.id}
                                        className="calendar-view-drafts__item"
                                    >
                                        <div className="calendar-view-drafts__row">
                                            <div>
                                                <div className="calendar-view-drafts__title">
                                                    {view.name}
                                                </div>
                                                <div className="calendar-view-drafts__meta">
                                                    {view.employeeNames.join(
                                                        ', ',
                                                    )}
                                                </div>
                                            </div>
                                            <div className="calendar-view-drafts__actions">
                                                <button
                                                    type="button"
                                                    className="btn btn-link btn-xs"
                                                    onClick={() =>
                                                        onEdit(view.id)
                                                    }
                                                >
                                                    edytuj
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-link btn-xs text-danger"
                                                    onClick={() =>
                                                        onDelete(view.id)
                                                    }
                                                    disabled={
                                                        deletingId === view.id
                                                    }
                                                >
                                                    usuń
                                                </button>
                                            </div>
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
