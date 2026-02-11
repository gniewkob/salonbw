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
            className={isActive ? 'active' : undefined}
            style={{
                backgroundColor: isOver ? 'rgba(0, 139, 180, 0.1)' : undefined,
                borderRadius: 4,
                transition: 'background-color 0.2s',
            }}
        >
            <a
                className="standard_group"
                data-id={group.id}
                href="#"
                title={group.name}
                onClick={(e) => {
                    e.preventDefault();
                    onClick();
                }}
            >
                <div className="icon_box">
                    <i className="icon sprite-user_group" />
                </div>
                {group.name}
                {isOver ? (
                    <span style={{ marginLeft: 8, fontSize: 11 }}>↑ upuść</span>
                ) : null}
            </a>
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
                            <h4>Grupy klientów</h4>
                            <div className="tree" id="groups">
                                <a
                                    className={`root ${activeQuickGroup === 'all' ? 'active' : ''}`}
                                    data-name="all"
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        updateFilters({
                                            groupId: undefined,
                                            tagId: undefined,
                                            hasUpcomingVisit: undefined,
                                            recentlyAdded: undefined,
                                            noOnlineReservations: undefined,
                                        });
                                    }}
                                >
                                    <div className="icon_box">
                                        <i className="icon sprite-group" />
                                    </div>
                                    wszyscy klienci
                                </a>

                                <ul>
                                    <li>
                                        <a
                                            data-name="visit_today"
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                updateFilters({
                                                    groupId: undefined,
                                                    hasUpcomingVisit: true,
                                                    recentlyAdded: undefined,
                                                    noOnlineReservations:
                                                        undefined,
                                                });
                                            }}
                                        >
                                            <div className="icon_box">
                                                <div className="icon sprite-group_today" />
                                            </div>
                                            Umówieni na dzisiaj
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            data-name="recently_added"
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                updateFilters({
                                                    groupId: undefined,
                                                    hasUpcomingVisit: undefined,
                                                    recentlyAdded: true,
                                                    noOnlineReservations:
                                                        undefined,
                                                });
                                            }}
                                        >
                                            <div className="icon_box">
                                                <i className="icon sprite-group_recent_added" />
                                            </div>
                                            Ostatnio dodani
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            data-name="offline_customers"
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                updateFilters({
                                                    groupId: undefined,
                                                    hasUpcomingVisit: undefined,
                                                    recentlyAdded: undefined,
                                                    noOnlineReservations: true,
                                                });
                                            }}
                                        >
                                            <div className="icon_box">
                                                <div className="icon sprite-client_absent_on" />
                                            </div>
                                            Nie rezerwują online
                                        </a>
                                    </li>
                                </ul>

                                <ul
                                    id="standard_groups"
                                    style={{
                                        display: showMoreGroups
                                            ? undefined
                                            : 'none',
                                    }}
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
                                        <a
                                            className="toggle_button"
                                            data-for="#standard_groups, #group_options"
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setShowMoreGroups((v) => !v);
                                            }}
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
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <div
                                className="tree_options"
                                id="group_options"
                                style={{
                                    display: showMoreGroups
                                        ? undefined
                                        : 'none',
                                }}
                            >
                                <a
                                    data-enable-sortable=""
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowManageGroupsModal(true);
                                    }}
                                >
                                    dodaj/edytuj/usuń
                                </a>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowCreateGroupModal(true);
                                    }}
                                >
                                    dodaj grupę
                                </a>
                            </div>
                        </div>

                        <div
                            className="column_row"
                            id="filter_boxes_container"
                            style={{
                                display: currentGroupId ? undefined : 'none',
                            }}
                        >
                            <h4>Kryteria wyszukiwania</h4>
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
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    updateFilters({
                                                        groupId: undefined,
                                                    });
                                                }}
                                                title="Wyczyść"
                                            >
                                                ✕
                                            </a>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="column_row" id="search_criteria">
                            <h4>Wybierz kryteria</h4>
                            <div className="list_container">
                                <ul
                                    className="simple-list"
                                    id="visible_filters"
                                >
                                    <li>
                                        <a
                                            className="filter_link"
                                            data-filter_name="services"
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleCriteriaClick(
                                                    'used_services',
                                                );
                                            }}
                                        >
                                            <div className="icon_box">
                                                <i className="icon sprite-filter_purchased_services" />
                                            </div>
                                            skorzystali z usług
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            className="filter_link"
                                            data-filter_name="events"
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleCriteriaClick(
                                                    'has_visit',
                                                );
                                            }}
                                        >
                                            <div className="icon_box">
                                                <i className="icon sprite-filter_visit_salon" />
                                            </div>
                                            mają wizytę w salonie
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            className="filter_link"
                                            data-filter_name="employees"
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleCriteriaClick(
                                                    'by_employee',
                                                );
                                            }}
                                        >
                                            <div className="icon_box">
                                                <i className="icon sprite-filter_handled_employees" />
                                            </div>
                                            obsługiwani przez pracowników
                                        </a>
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
                        await createGroup.mutateAsync(data);
                        setShowCreateGroupModal(false);
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
