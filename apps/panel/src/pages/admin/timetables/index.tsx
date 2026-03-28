'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Topbar from '@/components/Topbar';
import AdminSidebarMenu from '@/components/sidebars/AdminSidebarMenu';
import {
    TimetableEditor,
    ExceptionModal,
    ExceptionsList,
    type SlotData,
    type ExceptionFormData,
} from '@/components/timetables';
import {
    useTimetables,
    useTimetableExceptions,
    useTimetableMutations,
} from '@/hooks/useTimetables';
import type { Employee, TimetableException } from '@/types';

export default function AdminTimetablesPage() {
    const { user, apiFetch } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
        null,
    );
    const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
    const [editingException, setEditingException] =
        useState<TimetableException | null>(null);

    // Fetch employees
    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const data = await apiFetch<Employee[]>('/users/employees');
                setEmployees(data);
                if (data.length > 0 && !selectedEmployeeId) {
                    setSelectedEmployeeId(data[0].id);
                }
            } catch (err) {
                console.error('Failed to load employees:', err);
            }
        };
        if (user?.role === 'admin') {
            void loadEmployees();
        }
    }, [apiFetch, user, selectedEmployeeId]);

    // Data queries
    const { data: timetables, loading: timetablesLoading } = useTimetables({
        employeeId: selectedEmployeeId ?? undefined,
        enabled: !!selectedEmployeeId,
    });

    const activeTimetable = timetables.find((t) => t.isActive) ?? null;

    const { data: exceptions, loading: exceptionsLoading } =
        useTimetableExceptions(activeTimetable?.id ?? null);

    // Mutations
    const {
        createTimetable,
        updateTimetable,
        createException,
        updateException,
        deleteException,
        approveException,
    } = useTimetableMutations();

    const handleSaveSchedule = async (slots: SlotData[]) => {
        if (!selectedEmployeeId) return;

        if (activeTimetable) {
            await updateTimetable.mutateAsync({
                id: activeTimetable.id,
                slots,
            });
        } else {
            await createTimetable.mutateAsync({
                employeeId: selectedEmployeeId,
                name: `Grafik - ${employees.find((e) => e.id === selectedEmployeeId)?.name ?? ''}`,
                validFrom: new Date().toISOString().split('T')[0],
                slots,
            });
        }
    };

    const handleSaveException = async (data: ExceptionFormData) => {
        if (!activeTimetable) return;

        if (editingException) {
            await updateException.mutateAsync({
                id: editingException.id,
                ...data,
            });
        } else {
            await createException.mutateAsync({
                timetableId: activeTimetable.id,
                ...data,
            });
        }
    };

    const handleDeleteException = async (id: number) => {
        if (window.confirm('Czy na pewno chcesz usunąć ten wyjątek?')) {
            await deleteException.mutateAsync(id);
        }
    };

    const handleApproveException = async (id: number) => {
        await approveException.mutateAsync(id);
    };

    const isLoading = timetablesLoading || exceptionsLoading;

    if (!user || user.role !== 'admin') {
        return (
            <div className="d-flex align-items-center justify-content-center bg-light">
                <div className="text-center">
                    <h1 className="fs-3 fw-bold text-dark mb-2">
                        Brak dostępu
                    </h1>
                    <p className="text-muted">
                        Ta strona jest dostępna tylko dla administratorów.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-light">
            <Topbar />
            <div className="d-flex">
                <AdminSidebarMenu />

                <main className="flex-fill p-4">
                    {/* Header */}
                    <div className="mb-4">
                        <h1 className="fs-3 fw-bold text-dark">
                            Grafiki pracy
                        </h1>
                        <p className="text-muted mt-1">
                            Zarządzaj harmonogramami pracowników
                        </p>
                    </div>

                    {/* Employee selector */}
                    <div className="mb-4 bg-white rounded-3 shadow p-3">
                        <label className="d-block small fw-medium text-body mb-2">
                            Wybierz pracownika
                        </label>
                        <div className="d-flex gap-2 flex-wrap">
                            {employees.map((emp) => (
                                <button
                                    key={emp.id}
                                    type="button"
                                    onClick={() =>
                                        setSelectedEmployeeId(emp.id)
                                    }
                                    className={`px-3 py-2 rounded-3 small fw-medium ${
                                        selectedEmployeeId === emp.id
                                            ? 'bg-primary bg-opacity-10 text-white'
                                            : 'bg-light text-body bg-opacity-25'
                                    }`}
                                >
                                    {emp.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="d-flex align-items-center justify-content-center py-5">
                            <div className="rounded-circle h-8 w-8 border-bottom-2 border-primary"></div>
                            <span className="ms-2 text-muted">
                                Ładowanie...
                            </span>
                        </div>
                    ) : selectedEmployeeId ? (
                        <div className="-cols-1 gap-4">
                            {/* Weekly schedule editor */}
                            <TimetableEditor
                                timetable={activeTimetable}
                                onSave={handleSaveSchedule}
                                saving={
                                    createTimetable.isPending ||
                                    updateTimetable.isPending
                                }
                            />

                            {/* Exceptions section */}
                            <div className="bg-white rounded-3 shadow p-4">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h3 className="fs-5 fw-semibold text-dark">
                                        Wyjątki i nieobecności
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingException(null);
                                            setExceptionModalOpen(true);
                                        }}
                                        disabled={!activeTimetable}
                                        className="d-flex align-items-center gap-2 px-3 py-1 bg-primary bg-opacity-10 text-white small rounded-3 bg-opacity-10 disabled:"
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                            />
                                        </svg>
                                        Dodaj
                                    </button>
                                </div>

                                {!activeTimetable ? (
                                    <div className="text-center py-4 text-muted">
                                        Najpierw zapisz grafik tygodniowy, aby
                                        móc dodawać wyjątki.
                                    </div>
                                ) : (
                                    <ExceptionsList
                                        exceptions={exceptions}
                                        onEdit={(exception) => {
                                            setEditingException(exception);
                                            setExceptionModalOpen(true);
                                        }}
                                        onDelete={handleDeleteException}
                                        onApprove={handleApproveException}
                                        canApprove={true}
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            Wybierz pracownika, aby zarządzać jego grafikiem.
                        </div>
                    )}
                </main>
            </div>

            {/* Exception Modal */}
            <ExceptionModal
                isOpen={exceptionModalOpen}
                exception={editingException}
                onClose={() => {
                    setExceptionModalOpen(false);
                    setEditingException(null);
                }}
                onSave={handleSaveException}
            />
        </div>
    );
}
