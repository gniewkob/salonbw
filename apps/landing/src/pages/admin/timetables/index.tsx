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
    useTimetable,
    useTimetableExceptions,
    useTimetableMutations,
} from '@/hooks/useTimetables';
import type { Employee, Timetable, TimetableException } from '@/types';

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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Brak dostępu
                    </h1>
                    <p className="text-gray-600">
                        Ta strona jest dostępna tylko dla administratorów.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Topbar />
            <div className="flex">
                <AdminSidebarMenu />

                <main className="flex-1 p-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">
                            Grafiki pracy
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Zarządzaj harmonogramami pracowników
                        </p>
                    </div>

                    {/* Employee selector */}
                    <div className="mb-6 bg-white rounded-lg shadow p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Wybierz pracownika
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {employees.map((emp) => (
                                <button
                                    key={emp.id}
                                    type="button"
                                    onClick={() => setSelectedEmployeeId(emp.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        selectedEmployeeId === emp.id
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {emp.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            <span className="ml-3 text-gray-600">Ładowanie...</span>
                        </div>
                    ) : selectedEmployeeId ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Weekly schedule editor */}
                            <TimetableEditor
                                timetable={activeTimetable}
                                onSave={handleSaveSchedule}
                                saving={
                                    createTimetable.isPending || updateTimetable.isPending
                                }
                            />

                            {/* Exceptions section */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        Wyjątki i nieobecności
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingException(null);
                                            setExceptionModalOpen(true);
                                        }}
                                        disabled={!activeTimetable}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    <div className="text-center py-8 text-gray-500">
                                        Najpierw zapisz grafik tygodniowy, aby móc dodawać
                                        wyjątki.
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
                        <div className="text-center py-12 text-gray-500">
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
