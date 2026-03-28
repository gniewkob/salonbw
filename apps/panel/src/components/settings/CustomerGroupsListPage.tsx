import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
    useCustomerGroups,
    useDeleteCustomerGroup,
    useSortCustomerGroups,
    useUpdateCustomerGroup,
} from '@/hooks/useCustomers';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import CustomerSettingsNav from './CustomerSettingsNav';
import type { CustomerGroup } from '@/types';

type GroupNode = CustomerGroup & { children: GroupNode[] };

const EMPTY_NAV = <CustomerSettingsNav />;

function buildTree(groups: CustomerGroup[]) {
    const map = new Map<number, GroupNode>();
    const roots: GroupNode[] = [];

    for (const group of groups) {
        map.set(group.id, { ...group, children: [] });
    }

    for (const group of groups) {
        const node = map.get(group.id);
        if (!node) continue;
        if (group.parentId && map.has(group.parentId)) {
            map.get(group.parentId)?.children.push(node);
        } else {
            roots.push(node);
        }
    }

    const sortNodes = (nodes: GroupNode[]) => {
        nodes.sort(
            (a, b) =>
                (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
                a.name.localeCompare(b.name),
        );
        for (const node of nodes) sortNodes(node.children);
    };

    sortNodes(roots);
    return roots;
}

function flattenForSort(
    nodes: GroupNode[],
    parentId: number | null = null,
): Array<{ id: number; parentId: number | null; sortOrder: number }> {
    return nodes.flatMap((node, index) => [
        { id: node.id, parentId, sortOrder: index },
        ...flattenForSort(node.children, node.id),
    ]);
}

export default function CustomerGroupsListPage() {
    const {
        data: groups = [],
        isLoading,
        error,
        refetch,
    } = useCustomerGroups();
    const del = useDeleteCustomerGroup();
    const update = useUpdateCustomerGroup();
    const sort = useSortCustomerGroups();
    const [reorderMode, setReorderMode] = useState(false);
    const [draftGroups, setDraftGroups] = useState<CustomerGroup[]>([]);
    const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(
        null,
    );
    const [editName, setEditName] = useState('');
    const [editParentId, setEditParentId] = useState<string>('');

    useSetSecondaryNav(EMPTY_NAV);

    const tree = useMemo(() => buildTree(groups), [groups]);
    const draftTree = useMemo(() => buildTree(draftGroups), [draftGroups]);
    const parentOptions = useMemo(
        () => groups.map((group) => ({ id: group.id, name: group.name })),
        [groups],
    );

    useEffect(() => {
        setDraftGroups(groups);
    }, [groups]);

    const beginEdit = (group: CustomerGroup) => {
        setEditingGroup(group);
        setEditName(group.name);
        setEditParentId(group.parentId ? String(group.parentId) : '');
    };

    const moveNode = (groupId: number, direction: 'up' | 'down') => {
        const cloned = buildTree(draftGroups);
        const moveWithin = (nodes: GroupNode[]): boolean => {
            const index = nodes.findIndex((node) => node.id === groupId);
            if (index >= 0) {
                const target = direction === 'up' ? index - 1 : index + 1;
                if (target < 0 || target >= nodes.length) return true;
                const [item] = nodes.splice(index, 1);
                nodes.splice(target, 0, item);
                return true;
            }
            return nodes.some((node) => moveWithin(node.children));
        };

        moveWithin(cloned);
        const nextGroups = flattenForSort(cloned).map((item) => {
            const source = draftGroups.find((group) => group.id === item.id);
            return {
                ...source,
                id: item.id,
                name: source?.name ?? '',
                createdAt: source?.createdAt ?? new Date().toISOString(),
                parentId: item.parentId,
                sortOrder: item.sortOrder,
            };
        });
        setDraftGroups(nextGroups);
    };

    const renderTree = (nodes: GroupNode[]) => (
        <ul className="subtree-simple-tree">
            {nodes.map((node) => (
                <li key={node.id} className="node">
                    <div className="item" title={node.name}>
                        <span
                            className="sort_handle"
                            style={{
                                display: reorderMode ? 'inline-block' : 'none',
                            }}
                        />
                        {node.name}
                        <div className="dropdown">
                            <span
                                className="dropdown-toggle"
                                data-toggle="dropdown"
                            >
                                <span className="caret" />
                            </span>
                            <ul className="dropdown-menu dropdown-menu-right">
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => beginEdit(node)}
                                    >
                                        edytuj
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (
                                                window.confirm(
                                                    'Czy na pewno chcesz usunąć tę grupę klientów?',
                                                )
                                            ) {
                                                void del.mutateAsync(node.id);
                                            }
                                        }}
                                    >
                                        Usuń
                                    </button>
                                </li>
                                <li>
                                    <Link
                                        href={`/settings/customer_groups/new?parent_id=${node.id}`}
                                    >
                                        Nowa grupa
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        {reorderMode ? (
                            <div className="settings-customer-groups__reorder">
                                <button
                                    type="button"
                                    onClick={() => moveNode(node.id, 'up')}
                                >
                                    ↑
                                </button>
                                <button
                                    type="button"
                                    onClick={() => moveNode(node.id, 'down')}
                                >
                                    ↓
                                </button>
                            </div>
                        ) : null}
                    </div>
                    {node.children.length ? renderTree(node.children) : null}
                </li>
            ))}
        </ul>
    );

    return (
        <div className="settings-customer-groups-page">
            <SalonBreadcrumbs
                iconClass="sprite-breadcrumbs_settings"
                items={[
                    { label: 'Ustawienia', href: '/settings' },
                    { label: 'Grupy klientów' },
                ]}
            />

            <div className="actions settings-customer-groups__actions">
                <div id="general-actions">
                    <button
                        type="button"
                        className="button"
                        onClick={() => {
                            setDraftGroups(groups);
                            setReorderMode(true);
                        }}
                        style={{
                            display: reorderMode ? 'none' : undefined,
                        }}
                    >
                        zmień kolejność
                    </button>
                    <button
                        type="button"
                        className="button button-blue"
                        onClick={() =>
                            void sort
                                .mutateAsync(flattenForSort(draftTree))
                                .then(() => setReorderMode(false))
                        }
                        style={{
                            display: reorderMode ? undefined : 'none',
                        }}
                    >
                        zapisz kolejność
                    </button>
                    <button
                        type="button"
                        className="button"
                        onClick={() => {
                            setDraftGroups(groups);
                            setReorderMode(false);
                        }}
                        style={{
                            display: reorderMode ? undefined : 'none',
                        }}
                    >
                        anuluj
                    </button>
                    <Link className="button" href="/customers">
                        wróć do listy klientów
                    </Link>
                    <Link
                        className="button button-blue"
                        href="/settings/customer_groups/new"
                    >
                        dodaj grupę
                    </Link>
                </div>
            </div>

            {isLoading ? (
                <div className="settings-detail-state">Ładowanie grup...</div>
            ) : error ? (
                <div className="settings-detail-state settings-detail-state--error">
                    <div>Nie udało się pobrać grup klientów.</div>
                    <button
                        type="button"
                        className="btn btn-default"
                        onClick={() => void refetch()}
                    >
                        odśwież
                    </button>
                </div>
            ) : (
                <div className="column_row">
                    <ul className="simple-tree">
                        <li className="node root">
                            <div className="item">
                                <div className="pull_left">
                                    <div className="icon_box">
                                        <i className="icon sprite-group" />
                                    </div>
                                    Wszyscy klienci
                                </div>
                                <div className="c" />
                            </div>
                            {renderTree(reorderMode ? draftTree : tree)}
                        </li>
                    </ul>
                </div>
            )}

            {editingGroup ? (
                <div className="modal-backdrop fade in">
                    <div className="modal-dialog">
                        <form
                            className="modal-content"
                            onSubmit={(event) => {
                                event.preventDefault();
                                void update
                                    .mutateAsync({
                                        id: editingGroup.id,
                                        data: {
                                            name: editName.trim(),
                                            parentId: editParentId
                                                ? Number(editParentId)
                                                : null,
                                        },
                                    })
                                    .then(() => setEditingGroup(null));
                            }}
                        >
                            <div className="modal-header">
                                <button
                                    type="button"
                                    className="close"
                                    onClick={() => setEditingGroup(null)}
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button>
                                <h4 className="modal-title">Edycja grupy</h4>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label
                                        className="control-label"
                                        htmlFor="customer-group-edit-name"
                                    >
                                        Nazwa
                                    </label>
                                    <input
                                        id="customer-group-edit-name"
                                        className="form-control"
                                        value={editName}
                                        onChange={(event) =>
                                            setEditName(event.target.value)
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label
                                        className="control-label"
                                        htmlFor="customer-group-edit-parent"
                                    >
                                        Grupa nadrzędna
                                    </label>
                                    <select
                                        id="customer-group-edit-parent"
                                        className="form-control"
                                        value={editParentId}
                                        onChange={(event) =>
                                            setEditParentId(event.target.value)
                                        }
                                    >
                                        <option value=""></option>
                                        {parentOptions
                                            .filter(
                                                (group) =>
                                                    group.id !==
                                                    editingGroup.id,
                                            )
                                            .map((group) => (
                                                <option
                                                    key={group.id}
                                                    value={group.id}
                                                >
                                                    {group.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-default"
                                    onClick={() => setEditingGroup(null)}
                                >
                                    anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!editName.trim()}
                                >
                                    zapisz
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
