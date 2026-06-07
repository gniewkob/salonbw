import { useRouter } from 'next/router';
import {
    useCustomerGroups,
    useCreateCustomerGroup,
} from '@/hooks/useCustomers';
import { useServices } from '@/hooks/useServices';
import { useEmployees } from '@/hooks/useEmployees';
import { useEffect, useState } from 'react';
import type { CustomerFilterParams, CustomerGroup } from '@/types';
import CreateCustomerGroupModal from '../modals/CreateCustomerGroupModal';
import ManageCustomerGroupsModal from '../modals/ManageCustomerGroupsModal';
import SelectorModal from '../modals/SelectorModal';
import { useDroppable } from '@dnd-kit/core';

type FilterCriteriaId = 'used_services' | 'has_visit' | 'by_employee';

// Komponent dla grupy z obsługą drop
function DroppableGroupItem({
    group,
    isActive,
    onClick,
}: {
    group: CustomerGroup;
    isActive: boolean;
    onClick: () => void;
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: group.id,
    });

    return (
        <li
            ref={setNodeRef}
            className={`${isActive ? 'active ' : ''}rounded`}
            style={
                isOver ? { backgroundColor: 'rgba(0,139,180,0.10)' } : undefined
            }
        >
            <button
                type="button"
                className="standard_group"
                data-id={group.id}
                title={group.name}
                onClick={onClick}
            >
                <div className="icon_box">
                    <i className="icon sprite-user_group" aria-hidden="true" />
                </div>
                {group.name}
                {isOver ? (
                    <span className="ms-2" style={{ fontSize: 11 }}>
                        ↑ upuść
                    </span>
                ) : null}
            </button>
        </li>
    );
}

export default function ClientsNav() {
    const router = useRouter();
    const { data: groups } = useCustomerGroups();
    const { data: services } = useServices();
    const { data: employees } = useEmployees();
    const createGroup = useCreateCustomerGroup();

    const [showMoreGroups, setShowMoreGroups] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showManageGroupsModal, setShowManageGroupsModal] = useState(false);
    const [showServiceSelector, setShowServiceSelector] = useState(false);
    const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);

    // Helper to update query params
    const updateFilters = (newFilters: Partial<CustomerFilterParams>) => {
        const query: Record<string, string | string[] | undefined> = {
            ...router.query,
        };

        // Update with new values
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                delete query[key];
            } else {
                query[key] = String(value);
            }
        });

        // Always reset to page 1 on filter change
        query.page = '1';

        // Remove undefined/null values from existing query if any
        Object.keys(query).forEach((key) => {
            if (query[key] === undefined || query[key] === null) {
                delete query[key];
            }
        });

        void router.push({ pathname: router.pathname, query }, undefined, {
            shallow: true,
        });
    };

    const currentGroupId = router.query.groupId
        ? Number(router.query.groupId)
        : undefined;
    const activeQuickGroup =
        router.query.recentlyAdded === 'true'
            ? 'recently_added'
            : router.query.noOnlineReservations === 'true'
              ? 'offline_customers'
              : router.query.hasUpcomingVisit === 'true'
                ? 'visit_today'
                : !currentGroupId && !router.query.tagId
                  ? 'all'
                  : undefined;

    useEffect(() => {
        if (router.query.openCreateGroup !== '1') return;
        setShowCreateGroupModal(true);
        const nextQuery = { ...router.query };
        delete nextQuery.openCreateGroup;
        void router.replace(
            { pathname: router.pathname, query: nextQuery },
            undefined,
            { shallow: true },
        );
    }, [router]);

    const handleCriteriaClick = (id: FilterCriteriaId) => {
        if (id === 'has_visit') {
            const current = router.query.hasUpcomingVisit === 'true';
            updateFilters({ hasUpcomingVisit: current ? undefined : true });
        } else if (id === 'used_services') {
            setShowServiceSelector(true);
        } else if (id === 'by_employee') {
            setShowEmployeeSelector(true);
        }
    };

    return (
        <div className="customers_index" id="customers_sidenav">
            <div className="column_row">
                <div
                    id="index_show_left_column_content"
                    data-tree-url="/salonblackandwhite/settings/customer_groups/groups_tree"
                >
                    <div className="index_action_content">
                        <div className="customer_groups column_row">
                            <div className="nav-header">GRUPY KLIENTÓW</div>
                            <div className="tree" id="groups">
                                <button
                                    type="button"
                                    className={`root ${activeQuickGroup === 'all' ? 'active' : ''}`}
                                    data-name="all"
                                    aria-current={
                                        activeQuickGroup === 'all'
                                            ? 'true'
                                            : undefined
                                    }
                                    onClick={() =>
                                        updateFilters({
                                            groupId: undefined,
                                            tagId: undefined,
                                            hasUpcomingVisit: undefined,
                                            recentlyAdded: undefined,
                                            noOnlineReservations: undefined,
                                        })
                                    }
                                >
                                    <div className="icon_box">
                                        <i
                                            className="icon sprite-group"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    wszyscy klienci
                                </button>

                                <ul>
                                    <li>
                                        <button
                                            type="button"
                                            data-name="visit_today"
                                            onClick={() =>
                                                updateFilters({
                                                    groupId: undefined,
                                                    hasUpcomingVisit: true,
                                                    recentlyAdded: undefined,
                                                    noOnlineReservations:
                                                        undefined,
                                                })
                                            }
                                        >
                                            <div className="icon_box">
                                                <div className="icon sprite-group_today" />
                                            </div>
                                            Umówieni na dzisiaj
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            type="button"
                                            data-name="recently_added"
                                            onClick={() =>
                                                updateFilters({
                                                    groupId: undefined,
                                                    hasUpcomingVisit: undefined,
                                                    recentlyAdded: true,
                                                    noOnlineReservations:
                                                        undefined,
                                                })
                                            }
                                        >
                                            <div className="icon_box">
                                                <i
                                                    className="icon sprite-group_recent_added"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            Ostatnio dodani
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            type="button"
                                            data-name="offline_customers"
                                            onClick={() =>
                                                updateFilters({
                                                    groupId: undefined,
                                                    hasUpcomingVisit: undefined,
                                                    recentlyAdded: undefined,
                                                    noOnlineReservations: true,
                                                })
                                            }
                                        >
                                            <div className="icon_box">
                                                <div className="icon sprite-client_absent_on" />
                                            </div>
                                            Nie rezerwują online
                                        </button>
                                    </li>
                                </ul>

                                <ul
                                    id="standard_groups"
                                    className={
                                        showMoreGroups ? undefined : 'hidden'
                                    }
                                >
                                    {(groups ?? []).map((group) => (
                                        <DroppableGroupItem
                                            key={group.id}
                                            group={group}
                                            isActive={
                                                currentGroupId === group.id
                                            }
                                            onClick={() =>
                                                updateFilters({
                                                    groupId: group.id,
                                                })
                                            }
                                        />
                                    ))}
                                </ul>

                                <ul>
                                    <li>
                                        <button
                                            type="button"
                                            className="toggle_button"
                                            data-for="#standard_groups, #group_options"
                                            onClick={() =>
                                                setShowMoreGroups((v) => !v)
                                            }
                                        >
                                            <div className="icon_box">
                                                <i
                                                    className={`icon ${showMoreGroups ? 'sprite-filter_less' : 'sprite-filter_more'}`}
                                                />
                                            </div>
                                            <span>
                                                {showMoreGroups
                                                    ? 'mniej'
                                                    : 'więcej'}
                                            </span>
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            <div
                                className={`tree_options ${showMoreGroups ? '' : 'hidden'}`}
                                id="group_options"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowManageGroupsModal(true)
                                    }
                                >
                                    dodaj/edytuj/usuń
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCreateGroupModal(true)
                                    }
                                >
                                    dodaj grupę
                                </button>
                            </div>
                        </div>

                        <div
                            className={`column_row ${currentGroupId ? '' : 'hidden'}`}
                            id="filter_boxes_container"
                        >
                            <div className="nav-header">
                                KRYTERIA WYSZUKIWANIA
                            </div>
                            <div id="filter_boxes">
                                {groups
                                    ?.filter((g) => currentGroupId === g.id)
                                    .map((group) => (
                                        <div
                                            key={group.id}
                                            className="filter-box"
                                        >
                                            <span>należą do grup:</span>{' '}
                                            <strong>{group.name}</strong>{' '}
                                            <button
                                                type="button"
                                                aria-label="Wyczyść"
                                                onClick={() =>
                                                    updateFilters({
                                                        groupId: undefined,
                                                    })
                                                }
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="column_row" id="search_criteria">
                            <div className="nav-header">WYBIERZ KRYTERIA</div>
                            <div className="list_container">
                                <ul
                                    className="simple-list"
                                    id="visible_filters"
                                >
                                    <li>
                                        <button
                                            type="button"
                                            className="filter_link"
                                            data-filter_name="services"
                                            onClick={() =>
                                                handleCriteriaClick(
                                                    'used_services',
                                                )
                                            }
                                        >
                                            <div className="icon_box">
                                                <i
                                                    className="icon sprite-filter_purchased_services"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            skorzystali z usług
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            type="button"
                                            className="filter_link"
                                            data-filter_name="events"
                                            onClick={() =>
                                                handleCriteriaClick('has_visit')
                                            }
                                        >
                                            <div className="icon_box">
                                                <i
                                                    className="icon sprite-filter_visit_salon"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            mają wizytę w salonie
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            type="button"
                                            className="filter_link"
                                            data-filter_name="employees"
                                            onClick={() =>
                                                handleCriteriaClick(
                                                    'by_employee',
                                                )
                                            }
                                        >
                                            <div className="icon_box">
                                                <i
                                                    className="icon sprite-filter_handled_employees"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            obsługiwani przez pracowników
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showCreateGroupModal && (
                <CreateCustomerGroupModal
                    onClose={() => setShowCreateGroupModal(false)}
                    onCreate={async (data) => {
                        try {
                            await createGroup.mutateAsync(data);
                            setShowCreateGroupModal(false);
                        } catch {
                            // error handled by hook
                        }
                    }}
                    submitting={createGroup.isPending}
                />
            )}

            {showManageGroupsModal && (
                <ManageCustomerGroupsModal
                    onClose={() => setShowManageGroupsModal(false)}
                />
            )}

            {showServiceSelector && services && (
                <SelectorModal
                    title="Wybierz usługę"
                    items={services}
                    onSelect={(id) => {
                        updateFilters({ serviceId: id });
                        setShowServiceSelector(false);
                    }}
                    onClose={() => setShowServiceSelector(false)}
                />
            )}

            {showEmployeeSelector && employees && (
                <SelectorModal
                    title="Wybierz pracownika"
                    items={employees}
                    onSelect={(id) => {
                        updateFilters({ employeeId: id });
                        setShowEmployeeSelector(false);
                    }}
                    onClose={() => setShowEmployeeSelector(false)}
                />
            )}
        </div>
    );
}
