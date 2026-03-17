'use client';

import { useMemo, useState, type FormEvent } from 'react';
import type { Employee } from '@/types';

export interface CreateCalendarViewPayload {
    name: string;
    employeeIds: number[];
}

type Props = {
    employees: Employee[];
    onCancel: () => void;
    onSubmit: (payload: CreateCalendarViewPayload) => void;
};

export default function CreateCalendarViewModal({
    employees,
    onCancel,
    onSubmit,
}: Props) {
    const [name, setName] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const employeeCountLabel = useMemo(() => {
        return `Pracownicy (${employees.length})`;
    }, [employees.length]);

    const toggleEmployee = (employeeId: number) => {
        setSelectedIds((current) =>
            current.includes(employeeId)
                ? current.filter((id) => id !== employeeId)
                : [...current, employeeId],
        );
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit({
            name: name.trim(),
            employeeIds: selectedIds,
        });
    };

    const canSubmit = name.trim().length > 0 && selectedIds.length > 0;

    return (
        <div className="modal-backdrop fade in calendar-view-nested-backdrop">
            <div
                className="modal-dialog"
                onClick={(event) => event.stopPropagation()}
            >
                <form className="modal-content" onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <button
                            type="button"
                            className="close"
                            onClick={onCancel}
                            aria-label="Zamknij"
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title">Utwórz nowy widok</h4>
                    </div>

                    <div className="modal-body modal-body-scroll">
                        <ul className="calendar-view-form-list">
                            <li>
                                <label
                                    className="control-label"
                                    htmlFor="calendar_view_name"
                                >
                                    Nazwa
                                </label>
                                <input
                                    id="calendar_view_name"
                                    className="form-control"
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                    autoFocus
                                />
                            </li>
                        </ul>

                        <ul className="calendar-view-form-list">
                            <li>
                                <h5 className="calendar-view-form-list__heading">
                                    {employeeCountLabel}
                                </h5>
                            </li>
                            {employees.map((employee) => (
                                <li key={employee.id}>
                                    <label className="calendar-view-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(
                                                employee.id,
                                            )}
                                            onChange={() =>
                                                toggleEmployee(employee.id)
                                            }
                                        />
                                        <span>{employee.name}</span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!canSubmit}
                        >
                            zapisz
                        </button>
                        <button
                            type="button"
                            className="btn btn-default"
                            onClick={onCancel}
                        >
                            anuluj
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
