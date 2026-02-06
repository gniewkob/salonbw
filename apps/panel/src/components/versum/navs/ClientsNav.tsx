import { useRouter } from 'next/router';
import {
    useCustomerGroups,
    useCustomerTags,
    useCreateCustomerGroup,
} from '@/hooks/useCustomers';
import { useServices } from '@/hooks/useServices';
import { useEmployees } from '@/hooks/useEmployees';
import { useState } from 'react';
import type { CustomerFilterParams } from '@/types';
import CreateCustomerGroupModal from '../modals/CreateCustomerGroupModal';
import SelectorModal from '../modals/SelectorModal';

type FilterCriteriaId = 'used_services' | 'has_visit' | 'by_employee';

const QUICK_GROUPS = [
    { id: 'all', label: 'wszyscy klienci' },
    { id: 'today', label: 'Umówieni na dzisiaj' },
    { id: 'recent', label: 'Ostatnio dodani' },
    { id: 'no_online', label: 'Nie rezerwują online' },
] as const;

const FILTER_CRITERIA: Array<{
    id: FilterCriteriaId;
    label: string;
}> = [
    { id: 'used_services', label: 'skorzystali z usług' },
    { id: 'has_visit', label: 'mają wizytę w salonie' },
    { id: 'by_employee', label: 'obsługiwani przez pracowników' },
];

export default function ClientsNav() {
    const router = useRouter();
    const { data: groups } = useCustomerGroups();
    const { data: tags } = useCustomerTags();
    const { data: services } = useServices();
    const { data: employees } = useEmployees();
    const createGroup = useCreateCustomerGroup();

    const [showMoreGroups, setShowMoreGroups] = useState(false);
    const [showMoreCriteria, setShowMoreCriteria] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
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
        !currentGroupId && !router.query.tagId ? 'all' : undefined;

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
        <div className="sidebar-inner nav-scroll-container">
            <div className="nav-header">
                GRUPY KLIENTÓW
                <a
                    className="pull-right"
                    href="javascript:;"
                    title="Dodaj grupę"
                    onClick={() => setShowCreateGroupModal(true)}
                >
                    + dodaj
                </a>
            </div>
            <ul className="nav nav-list">
                {QUICK_GROUPS.map((group) => (
                    <li
                        key={group.id}
                        className={
                            activeQuickGroup === group.id ? 'active' : undefined
                        }
                    >
                        <a
                            href="javascript:;"
                            onClick={() =>
                                updateFilters({
                                    groupId: undefined,
                                    tagId: undefined,
                                })
                            }
                        >
                            {group.label}
                        </a>
                    </li>
                ))}
            </ul>

            {groups && groups.length > 0 && (
                <ul className="nav nav-list">
                    {(showMoreGroups ? groups : groups.slice(0, 3)).map(
                        (group) => (
                            <li
                                key={group.id}
                                className={
                                    currentGroupId === group.id
                                        ? 'active'
                                        : undefined
                                }
                            >
                                <a
                                    href="javascript:;"
                                    onClick={() =>
                                        updateFilters({ groupId: group.id })
                                    }
                                >
                                    {group.color && (
                                        <span
                                            className="versum-chip"
                                            style={{
                                                backgroundColor: group.color,
                                            }}
                                        />
                                    )}
                                    {group.name}
                                    {group.memberCount !== undefined && (
                                        <span className="versum-muted ml-auto">
                                            {group.memberCount}
                                        </span>
                                    )}
                                </a>
                            </li>
                        ),
                    )}
                    {groups.length > 3 && (
                        <li>
                            <button
                                onClick={() =>
                                    setShowMoreGroups(!showMoreGroups)
                                }
                                className="versum-secondarynav__more-btn"
                            >
                                + {showMoreGroups ? 'mniej' : 'więcej'}
                            </button>
                        </li>
                    )}
                </ul>
            )}

            <div className="nav-header">WYBIERZ KRYTERIA</div>
            <ul className="nav nav-list">
                {(showMoreCriteria
                    ? FILTER_CRITERIA
                    : FILTER_CRITERIA.slice(0, 3)
                ).map((criterion) => {
                    const isActive =
                        (criterion.id === 'has_visit' &&
                            router.query.hasUpcomingVisit === 'true') ||
                        (criterion.id === 'used_services' &&
                            router.query.serviceId !== undefined) ||
                        (criterion.id === 'by_employee' &&
                            router.query.employeeId !== undefined);

                    return (
                        <li
                            key={criterion.id}
                            className={isActive ? 'active' : undefined}
                        >
                            <a
                                href="javascript:;"
                                onClick={() =>
                                    handleCriteriaClick(criterion.id)
                                }
                            >
                                {criterion.label}
                            </a>
                        </li>
                    );
                })}
                <li>
                    <button
                        onClick={() => setShowMoreCriteria(!showMoreCriteria)}
                        className="versum-secondarynav__more-btn"
                    >
                        + {showMoreCriteria ? 'mniej' : 'więcej'}
                    </button>
                </li>
            </ul>

            {tags && tags.length > 0 && (
                <section className="versum-secondarynav__section">
                    <h4>TAGI</h4>
                    <div className="versum-secondarynav__tags">
                        {tags.slice(0, 10).map((tag) => (
                            <button
                                key={tag.id}
                                onClick={() => {
                                    const currentTagId = router.query.tagId
                                        ? Number(router.query.tagId)
                                        : undefined;
                                    updateFilters({
                                        tagId:
                                            currentTagId === tag.id
                                                ? undefined
                                                : tag.id,
                                    });
                                }}
                                className={`versum-tag ${Number(router.query.tagId) === tag.id ? 'is-active' : ''}`}
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>
                </section>
            )}

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
