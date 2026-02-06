'use client';

import { useState, useEffect, useMemo } from 'react';
import type {
    Service,
    ServiceCategory,
    PriceType,
    Employee,
    EmployeeService,
} from '@/types';
import SelectorModal from '@/components/versum/modals/SelectorModal';
import { useEmployees } from '@/hooks/useEmployees';
import { useServiceEmployeesDetails } from '@/hooks/useServicesAdmin';

interface Props {
    isOpen: boolean;
    service: Service | null;
    categories: ServiceCategory[];
    onClose: () => void;
    onSave: (data: ServiceFormData) => Promise<void> | void;
}

export interface ServiceFormData {
    name: string;
    description: string;
    publicDescription?: string;
    privateDescription?: string;
    duration: number;
    price: number;
    priceType: PriceType;
    vatRate?: number;
    isFeatured?: boolean;
    categoryId: number | undefined;
    commissionPercent: number | undefined;
    isActive: boolean;
    onlineBooking: boolean;
    assignedEmployees: Array<{
        employeeId: number;
        customDuration?: number;
        customPrice?: number;
    }>;
}

const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240];

export default function ServiceFormModal({
    isOpen,
    service,
    categories,
    onClose,
    onSave,
}: Props) {
    const [activeTab, setActiveTab] = useState<
        'basic' | 'resources' | 'employees' | 'description'
    >('basic');
    const [formData, setFormData] = useState<ServiceFormData>({
        name: '',
        description: '',
        publicDescription: '',
        privateDescription: '',
        duration: 60,
        price: 0,
        priceType: 'fixed',
        vatRate: 23,
        isFeatured: false,
        categoryId: undefined,
        commissionPercent: undefined,
        isActive: true,
        onlineBooking: true,
        assignedEmployees: [],
    });

    const [isEmployeeSelectorOpen, setIsEmployeeSelectorOpen] = useState(false);
    const { data: allEmployees = [] } = useEmployees();
    const { data: existingEmployees = [], refetch: refetchEmployees } =
        useServiceEmployeesDetails(service?.id || 0);

    useEffect(() => {
        if (service) {
            setFormData({
                name: service.name,
                description: service.description || '',
                publicDescription: service.publicDescription || '',
                privateDescription: service.privateDescription || '',
                duration: service.duration,
                price: service.price,
                priceType: service.priceType,
                vatRate: service.vatRate ?? 23,
                isFeatured: service.isFeatured ?? false,
                categoryId: service.categoryId,
                commissionPercent: service.commissionPercent,
                isActive: service.isActive,
                onlineBooking: service.onlineBooking,
                assignedEmployees: existingEmployees.map((e) => ({
                    employeeId: e.employeeId,
                    customDuration: e.customDuration,
                    customPrice: e.customPrice,
                })),
            });
        } else {
            setFormData({
                name: '',
                description: '',
                publicDescription: '',
                privateDescription: '',
                duration: 60,
                price: 0,
                priceType: 'fixed',
                vatRate: 23,
                isFeatured: false,
                categoryId: undefined,
                commissionPercent: undefined,
                isActive: true,
                onlineBooking: true,
                assignedEmployees: [],
            });
        }
    }, [service, isOpen, existingEmployees]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void onSave(formData);
    };

    const flattenCategories = (
        cats: ServiceCategory[],
        level = 0,
    ): Array<{ id: number; name: string; level: number }> => {
        const result: Array<{ id: number; name: string; level: number }> = [];
        for (const cat of cats) {
            result.push({ id: cat.id, name: cat.name, level });
            if (cat.children) {
                result.push(...flattenCategories(cat.children, level + 1));
            }
        }
        return result;
    };

    const flatCategories = flattenCategories(categories);

    const availableEmployeesForSelection = useMemo(() => {
        const assignedIds = new Set(
            formData.assignedEmployees.map((e) => e.employeeId),
        );
        return (allEmployees || []).filter((e) => !assignedIds.has(e.id));
    }, [allEmployees, formData.assignedEmployees]);

    const handleEmployeeSelect = (employeeId: number) => {
        setFormData({
            ...formData,
            assignedEmployees: [...formData.assignedEmployees, { employeeId }],
        });
        setIsEmployeeSelectorOpen(false);
    };

    const handleRemoveEmployee = (employeeId: number) => {
        setFormData({
            ...formData,
            assignedEmployees: formData.assignedEmployees.filter(
                (e) => e.employeeId !== employeeId,
            ),
        });
    };

    const handleEmployeeDataChange = (
        employeeId: number,
        field: 'customDuration' | 'customPrice',
        value: number | undefined,
    ) => {
        setFormData({
            ...formData,
            assignedEmployees: formData.assignedEmployees.map((e) =>
                e.employeeId === employeeId ? { ...e, [field]: value } : e,
            ),
        });
    };

    if (!isOpen) return null;

    const renderBasicTab = () => (
        <div className="tab-pane active" style={{ padding: '20px 0' }}>
            <div className="form-group">
                <label className="col-sm-3 control-label">Nazwa usługi *</label>
                <div className="col-sm-9">
                    <input
                        type="text"
                        className="form-control"
                        title="Nazwa usługi"
                        value={formData.name}
                        onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                        }
                        required
                    />
                </div>
            </div>

            <div className="form-group">
                <label className="col-sm-3 control-label">Kategoria</label>
                <div className="col-sm-9">
                    <select
                        value={formData.categoryId || ''}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                categoryId: e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                            })
                        }
                        className="form-control"
                    >
                        <option value="">Bez kategorii</option>
                        {flatCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {'\u00A0'.repeat(cat.level * 4)} {cat.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label className="col-sm-3 control-label">Czas trwania *</label>
                <div className="col-sm-4">
                    <select
                        value={formData.duration}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                duration: Number(e.target.value),
                            })
                        }
                        className="form-control"
                    >
                        {DURATION_OPTIONS.map((d) => (
                            <option key={d} value={d}>
                                {d < 60
                                    ? `${d} min`
                                    : d % 60 === 0
                                      ? `${d / 60} godz.`
                                      : `${Math.floor(d / 60)} godz. ${d % 60} min`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label className="col-sm-3 control-label">Cena (PLN) *</label>
                <div className="col-sm-4">
                    <div className="input-group">
                        <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            title="Cena"
                            value={formData.price}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    price: parseFloat(e.target.value) || 0,
                                })
                            }
                            required
                        />
                        <span className="input-group-addon">zł</span>
                    </div>
                </div>
                <div className="col-sm-5">
                    <select
                        value={formData.priceType}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                priceType: e.target.value as PriceType,
                            })
                        }
                        title="Typ ceny"
                        className="form-control"
                    >
                        <option value="fixed">Stała</option>
                        <option value="from">Od (minimalna)</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label className="col-sm-3 control-label">Stawka VAT</label>
                <div className="col-sm-4">
                    <div className="input-group">
                        <input
                            type="number"
                            step="0.01"
                            title="Stawka VAT"
                            value={formData.vatRate || ''}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    vatRate: e.target.value
                                        ? parseFloat(e.target.value)
                                        : undefined,
                                })
                            }
                            className="form-control"
                            placeholder="23"
                        />
                        <span className="input-group-addon">%</span>
                    </div>
                </div>
            </div>

            <div className="form-group">
                <div className="col-sm-offset-3 col-sm-9">
                    <div className="checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        isActive: e.target.checked,
                                    })
                                }
                            />
                            Usługa aktywna
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={formData.onlineBooking}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        onlineBooking: e.target.checked,
                                    })
                                }
                            />
                            Dostępna w rezerwacjach online
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDescriptionTab = () => (
        <div className="tab-pane active" style={{ padding: '20px 0' }}>
            <div className="form-group">
                <label className="col-sm-3 control-label">
                    Opis (prywatny)
                </label>
                <div className="col-sm-9">
                    <textarea
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                description: e.target.value,
                            })
                        }
                        rows={4}
                        className="form-control"
                        placeholder="Opis widoczny tylko dla personelu"
                    />
                </div>
            </div>
            <div className="form-group">
                <label className="col-sm-3 control-label">Opis publiczny</label>
                <div className="col-sm-9">
                    <textarea
                        value={formData.publicDescription}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                publicDescription: e.target.value,
                            })
                        }
                        rows={4}
                        className="form-control"
                        placeholder="Opis widoczny dla klientów w rezerwacji online"
                    />
                </div>
            </div>
        </div>
    );

    const renderResourcesTab = () => (
        <div className="tab-pane active" style={{ padding: '20px 0' }}>
            <div className="alert alert-info">
                W tej sekcji możesz przypisać zasoby (gabinety, urządzenia)
                wymagane do wykonania tej usługi.
            </div>
            <p className="text-center versum-muted" style={{ padding: '40px' }}>
                Zasoby nie są jeszcze skonfigurowane w systemie.
            </p>
        </div>
    );

    const renderEmployeesTab = () => (
        <div className="tab-pane active" style={{ padding: '20px 0' }}>
            <div className="alert alert-info">
                Wybierz pracowników, którzy świadczą tę usługę. Możesz również
                zdefiniować indywidualne czasy trwania i ceny.
            </div>

            <div className="versum-table-wrap">
                <table className="versum-table">
                    <thead>
                        <tr>
                            <th>Pracownik</th>
                            <th style={{ width: '150px' }}>Czas trwania</th>
                            <th style={{ width: '150px' }}>Cena</th>
                            <th style={{ width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {formData.assignedEmployees.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="text-center versum-muted"
                                    style={{ padding: '20px' }}
                                >
                                    Nie wybrano żadnych pracowników.
                                </td>
                            </tr>
                        ) : (
                            formData.assignedEmployees.map((assignment) => {
                                const employee = (allEmployees || []).find(
                                    (e) => e.id === assignment.employeeId,
                                );
                                return (
                                    <tr key={assignment.employeeId}>
                                        <td>
                                            {employee?.name ||
                                                `Pracownik #${assignment.employeeId}`}
                                        </td>
                                        <td>
                                            <select
                                                className="form-control input-sm"
                                                value={
                                                    assignment.customDuration ??
                                                    ''
                                                }
                                                title="Indywidualny czas trwania"
                                                onChange={(e) =>
                                                    handleEmployeeDataChange(
                                                        assignment.employeeId,
                                                        'customDuration',
                                                        e.target.value
                                                            ? Number(
                                                                  e.target
                                                                      .value,
                                                              )
                                                            : undefined,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Domyślny (
                                                    {formData.duration} min)
                                                </option>
                                                {DURATION_OPTIONS.map((d) => (
                                                    <option key={d} value={d}>
                                                        {d} min
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <div className="input-group input-group-sm">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    title="Indywidualna cena dla pracownika"
                                                    placeholder={formData.price.toString()}
                                                    value={
                                                        assignment.customPrice ??
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        handleEmployeeDataChange(
                                                            assignment.employeeId,
                                                            'customPrice',
                                                            e.target.value
                                                                ? parseFloat(
                                                                      e.target
                                                                          .value,
                                                                  )
                                                                : undefined,
                                                        )
                                                    }
                                                />
                                                <span className="input-group-addon">
                                                    zł
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <button
                                                type="button"
                                                className="btn btn-xs btn-default"
                                                onClick={() =>
                                                    handleRemoveEmployee(
                                                        assignment.employeeId,
                                                    )
                                                }
                                                title="Usuń"
                                            >
                                                &times;
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '15px' }}>
                <button
                    type="button"
                    className="btn btn-default btn-sm"
                    onClick={() => setIsEmployeeSelectorOpen(true)}
                >
                    + dodaj pracownika
                </button>
            </div>
        </div>
    );

    return (
        <div
            className="modal fade in"
            style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <button
                            type="button"
                            className="close"
                            onClick={onClose}
                        >
                            &times;
                        </button>
                        <h4 className="modal-title">
                            {service ? 'Edytuj usługę' : 'Nowa usługa'}
                        </h4>
                    </div>

                    <form className="form-horizontal" onSubmit={handleSubmit}>
                        <div
                            className="modal-body"
                            style={{ padding: '0 15px' }}
                        >
                            <ul
                                className="nav nav-tabs"
                                style={{ marginTop: '15px' }}
                            >
                                <li
                                    className={
                                        activeTab === 'basic' ? 'active' : ''
                                    }
                                >
                                    <a
                                        href="javascript:;"
                                        onClick={() => setActiveTab('basic')}
                                    >
                                        Podstawowe dane
                                    </a>
                                </li>
                                <li
                                    className={
                                        activeTab === 'resources'
                                            ? 'active'
                                            : ''
                                    }
                                >
                                    <a
                                        href="javascript:;"
                                        onClick={() =>
                                            setActiveTab('resources')
                                        }
                                    >
                                        Zasoby
                                    </a>
                                </li>
                                <li
                                    className={
                                        activeTab === 'employees'
                                            ? 'active'
                                            : ''
                                    }
                                >
                                    <a
                                        href="javascript:;"
                                        onClick={() =>
                                            setActiveTab('employees')
                                        }
                                    >
                                        Pracownicy
                                    </a>
                                </li>
                                <li
                                    className={
                                        activeTab === 'description'
                                            ? 'active'
                                            : ''
                                    }
                                >
                                    <a
                                        href="javascript:;"
                                        onClick={() =>
                                            setActiveTab('description')
                                        }
                                    >
                                        Opis
                                    </a>
                                </li>
                            </ul>

                            <div
                                className="tab-content"
                                style={{ minHeight: '300px' }}
                            >
                                {activeTab === 'basic' && renderBasicTab()}
                                {activeTab === 'resources' &&
                                    renderResourcesTab()}
                                {activeTab === 'employees' &&
                                    renderEmployeesTab()}
                                {activeTab === 'description' &&
                                    renderDescriptionTab()}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-default"
                            >
                                Anuluj
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {service ? 'Zapisz zmiany' : 'Dodaj usługę'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {isEmployeeSelectorOpen && (
                <SelectorModal
                    title="Wybierz pracownika"
                    items={availableEmployeesForSelection}
                    onSelect={handleEmployeeSelect}
                    onClose={() => setIsEmployeeSelectorOpen(false)}
                />
            )}
        </div>
    );
}
