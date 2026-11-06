import { useState, type FormEvent } from 'react';
import Modal from '@/components/Modal';
import {
    useCreateCustomerGroup,
    useCustomerGroups,
    useDeleteCustomerGroup,
    useSortCustomerGroups,
    useUpdateCustomerGroup,
} from '@/hooks/useCustomers';
import type { CustomerGroup } from '@/types';
import {
    buildV18GroupTree,
    flattenV18GroupSort,
    moveV18Group,
    type V18GroupNode,
    type V18GroupSortItem,
} from '@/utils/v18GroupHierarchy';
import styles from '@/styles/V18CustomerGroupsManager.module.css';

type Props = {
    onClose: () => void;
    selectedCustomerIds: number[];
    onChanged: () => void;
    onGroupDeleted?: (id: number) => void;
};

type Draft = {
    name: string;
    description: string;
    color: string;
    parentId: string;
    discountPercent: string;
    includeSelected: boolean;
};

const EMPTY_DRAFT: Draft = {
    name: '',
    description: '',
    color: '#67538a',
    parentId: '',
    discountPercent: '',
    includeSelected: false,
};

const fromGroup = (group: CustomerGroup): Draft => ({
    name: group.name,
    description: group.description ?? '',
    color: group.color ?? '#67538a',
    parentId: group.parentId ? String(group.parentId) : '',
    discountPercent:
        group.discountPercent == null ? '' : String(group.discountPercent),
    includeSelected: false,
});

/** Prevent cycles when editing an existing parent/child group hierarchy. */
function forbiddenParents(groups: CustomerGroup[], groupId: number | null) {
    const forbidden = new Set<number>();
    if (groupId === null) return forbidden;
    forbidden.add(groupId);
    let changed = true;
    while (changed) {
        changed = false;
        for (const group of groups) {
            if (
                group.parentId != null &&
                forbidden.has(group.parentId) &&
                !forbidden.has(group.id)
            ) {
                forbidden.add(group.id);
                changed = true;
            }
        }
    }
    return forbidden;
}

/**
 * Groups share the existing CRM hooks, hierarchy and discount semantics.
 * Ordering and deletion use the existing CRM hooks; customer records are preserved.
 */
export default function V18CustomerGroupsManager({
    onClose,
    selectedCustomerIds,
    onChanged,
    onGroupDeleted,
}: Props) {
    const {
        data: groups = [],
        isLoading,
        isError,
        refetch,
    } = useCustomerGroups();
    const create = useCreateCustomerGroup();
    const update = useUpdateCustomerGroup();
    const sort = useSortCustomerGroups();
    const remove = useDeleteCustomerGroup();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
    const [draftOrder, setDraftOrder] = useState<V18GroupSortItem[] | null>(
        null,
    );
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(
        null,
    );
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const busy =
        create.isPending ||
        update.isPending ||
        sort.isPending ||
        remove.isPending;
    const reorderMode = draftOrder !== null;
    const name = draft.name.trim();
    const discountText = draft.discountPercent.trim();
    const discount = discountText ? Number(discountText) : null;
    const validDiscount =
        discount === null ||
        (Number.isFinite(discount) && discount >= 0 && discount <= 100);
    const validColor = /^#[0-9a-fA-F]{6}$/.test(draft.color);
    const parent = draft.parentId ? Number(draft.parentId) : null;
    const validParent =
        parent === null || groups.some((group) => group.id === parent);
    const forbidden = forbiddenParents(groups, editingId);
    const duplicateName = groups.some(
        (group) =>
            group.id !== editingId &&
            group.name.toLocaleLowerCase('pl-PL') ===
                name.toLocaleLowerCase('pl-PL'),
    );
    const canSave =
        !busy &&
        !isLoading &&
        !isError &&
        !reorderMode &&
        name.length > 0 &&
        name.length <= 100 &&
        validDiscount &&
        validColor &&
        validParent &&
        (parent === null || !forbidden.has(parent)) &&
        !duplicateName;
    // Draft ordering changes only sortOrder. Never change membership or
    // parent relations as a side effect of moving a row.
    const draftPosition = new Map(
        (draftOrder ?? []).map((item) => [item.id, item.sortOrder]),
    );
    const displayedGroups = groups.map((group) => ({
        ...group,
        sortOrder: draftPosition.get(group.id) ?? group.sortOrder,
    }));
    const tree = buildV18GroupTree(displayedGroups);
    const orderedGroups = [...groups].sort((a, b) =>
        a.name.localeCompare(b.name, 'pl'),
    );
    const pendingDelete = groups.find((group) => group.id === pendingDeleteId);
    const childCount = pendingDelete
        ? groups.filter((group) => group.parentId === pendingDelete.id).length
        : 0;
    const deleteMemberCount =
        pendingDelete?.memberCount ?? pendingDelete?.members?.length;

    const startEdit = (group: CustomerGroup) => {
        setEditingId(group.id);
        setDraft(fromGroup(group));
        setError('');
        setSuccess('');
    };
    const startCreate = () => {
        setEditingId(null);
        setDraft(EMPTY_DRAFT);
        setError('');
        setSuccess('');
    };
    const close = () => {
        if (!busy) onClose();
    };

    const startReorder = () => {
        if (busy || isError || isLoading) return;
        setDraftOrder(flattenV18GroupSort(buildV18GroupTree(groups)));
        setPendingDeleteId(null);
        setError('');
        setSuccess('');
    };

    const moveGroup = (id: number, direction: 'up' | 'down') => {
        if (!reorderMode || busy) return;
        const next = moveV18Group(displayedGroups, id, direction);
        if (next !== null) setDraftOrder(next);
    };

    const saveReorder = async () => {
        if (!draftOrder || busy || isError) return;
        setError('');
        setSuccess('');
        try {
            await sort.mutateAsync(draftOrder);
            setDraftOrder(null);
            setSuccess('Kolejność grup została zapisana.');
            onChanged();
        } catch {
            setError('Nie udało się zapisać kolejności grup.');
        }
    };

    const deleteGroup = async () => {
        if (!pendingDelete || childCount > 0 || busy || reorderMode) return;
        const id = pendingDelete.id;
        setError('');
        setSuccess('');
        try {
            await remove.mutateAsync(id);
            setPendingDeleteId(null);
            if (editingId === id) startCreate();
            setSuccess('Grupa została usunięta. Konta klientów pozostają.');
            onGroupDeleted?.(id);
            onChanged();
        } catch {
            setError('Nie udało się usunąć grupy. Spróbuj ponownie.');
        }
    };

    const renderTree = (nodes: V18GroupNode[], depth = 0) => (
        <ul
            className={
                depth === 0 ? styles.groupList : styles.groupChildren
            }
        >
            {nodes.map((group, index) => {
                const hasChildren = group.children.length > 0;
                return (
                    <li key={group.id} className={styles.groupItem}>
                        <div className={styles.groupRow}>
                            <span
                                className={styles.swatch}
                                style={{
                                    backgroundColor: group.color ?? '#67538a',
                                }}
                                aria-hidden="true"
                            />
                            <div className={styles.groupDetails}>
                                <strong>{group.name}</strong>
                                <small>
                                    {group.memberCount ??
                                        group.members?.length ??
                                        '—'}{' '}
                                    klientów
                                    {group.discountPercent != null
                                        ? ' · rabat ' +
                                          group.discountPercent +
                                          '%'
                                        : ''}
                                    {hasChildren
                                        ? ' · podgrupy: ' + group.children.length
                                        : ''}
                                </small>
                            </div>
                            {reorderMode ? (
                                <div className={styles.reorderActions}>
                                    <button
                                        type="button"
                                        className={styles.secondary}
                                        disabled={busy || index === 0}
                                        aria-label={
                                            'Przesuń grupę ' +
                                            group.name +
                                            ' w górę'
                                        }
                                        onClick={() =>
                                            moveGroup(group.id, 'up')
                                        }
                                    >
                                        ↑
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.secondary}
                                        disabled={
                                            busy || index === nodes.length - 1
                                        }
                                        aria-label={
                                            'Przesuń grupę ' +
                                            group.name +
                                            ' w dół'
                                        }
                                        onClick={() =>
                                            moveGroup(group.id, 'down')
                                        }
                                    >
                                        ↓
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.groupActions}>
                                    <button
                                        type="button"
                                        className={styles.secondary}
                                        disabled={busy || isError}
                                        aria-label={
                                            'Edytuj grupę ' + group.name
                                        }
                                        onClick={() => startEdit(group)}
                                    >
                                        Edytuj
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.danger}
                                        disabled={busy || isError || hasChildren}
                                        title={
                                            hasChildren
                                                ? 'Przed usunięciem przenieś lub usuń podgrupy'
                                                : undefined
                                        }
                                        aria-label={
                                            'Usuń grupę ' + group.name
                                        }
                                        onClick={() => {
                                            setPendingDeleteId(group.id);
                                            setError('');
                                            setSuccess('');
                                        }}
                                    >
                                        Usuń
                                    </button>
                                </div>
                            )}
                        </div>
                        {hasChildren
                            ? renderTree(group.children, depth + 1)
                            : null}
                    </li>
                );
            })}
        </ul>
    );

    const save = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSave) return;
        setError('');
        setSuccess('');
        const data = {
            name,
            description: draft.description.trim(),
            color: draft.color,
            parentId: parent,
            discountPercent: discount,
        };
        try {
            if (editingId === null) {
                await create.mutateAsync({
                    ...data,
                    memberIds:
                        draft.includeSelected && selectedCustomerIds.length > 0
                            ? selectedCustomerIds
                            : undefined,
                });
                setSuccess('Grupa została utworzona.');
            } else {
                await update.mutateAsync({ id: editingId, data });
                setSuccess('Zmiany grupy zostały zapisane.');
            }
            setEditingId(null);
            setDraft(EMPTY_DRAFT);
            onChanged();
        } catch {
            setError('Nie udało się zapisać grupy. Spróbuj ponownie.');
        }
    };

    return (
        <Modal open size="lg" onClose={close}>
            <section
                className={styles.manager}
                aria-label="Zarządzanie grupami klientów"
            >
                <div className={styles.heading}>
                    <div>
                        <span className={styles.eyebrow}>
                            Salon Black &amp; White · CRM
                        </span>
                        <h2>Grupy klientów</h2>
                        <p>
                            Twórz i edytuj grupy. Istniejące przypisania
                            klientów pozostają zachowane.
                        </p>
                    </div>
                    <button
                        type="button"
                        className={styles.secondary}
                        disabled={busy}
                        onClick={close}
                        aria-label="Zamknij zarządzanie grupami"
                    >
                        Zamknij
                    </button>
                </div>

                {error ? (
                    <p role="alert" className={styles.error}>
                        {error}
                    </p>
                ) : null}
                {success ? (
                    <p role="status" className={styles.success}>
                        {success}
                    </p>
                ) : null}
                {isError ? (
                    <div role="alert" className={styles.error}>
                        Nie udało się pobrać grup.
                        <button
                            type="button"
                            className={styles.secondary}
                            onClick={() => void refetch()}
                        >
                            Ponów pobieranie
                        </button>
                    </div>
                ) : null}

                <div className={styles.columns}>
                    <div className={styles.listPanel}>
                        <div className={styles.sectionHeading}>
                            <h3>Hierarchia grup</h3>
                            <span>{groups.length}</span>
                        </div>
                        <div className={styles.reorderToolbar}>
                            {reorderMode ? (
                                <>
                                    <button
                                        type="button"
                                        className={styles.primary}
                                        disabled={busy}
                                        onClick={() => void saveReorder()}
                                    >
                                        {sort.isPending
                                            ? 'Zapisywanie…'
                                            : 'Zapisz kolejność'}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.secondary}
                                        disabled={busy}
                                        onClick={() => setDraftOrder(null)}
                                    >
                                        Anuluj kolejność
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className={styles.secondary}
                                    disabled={
                                        busy || isError || groups.length < 2
                                    }
                                    onClick={startReorder}
                                >
                                    Zmień kolejność
                                </button>
                            )}
                        </div>
                        {isLoading ? (
                            <p role="status">Ładowanie grup…</p>
                        ) : tree.length === 0 ? (
                            <p>Nie ma jeszcze grup klientów.</p>
                        ) : (
                            renderTree(tree)
                        )}
                        {reorderMode ? (
                            <p className={styles.hint}>
                                Strzałki zmieniają kolejność wyłącznie wśród
                                grup o tym samym rodzicu. Zapisz lub anuluj,
                                aby zakończyć zmianę.
                            </p>
                        ) : null}
                        {pendingDelete && !reorderMode ? (
                            <div
                                className={styles.deleteConfirm}
                                aria-label="Potwierdzenie usunięcia grupy"
                            >
                                <strong>
                                    Usunąć grupę „{pendingDelete.name}”?
                                </strong>
                                <p>
                                    {childCount > 0
                                        ? 'Ta grupa zawiera podgrupy. Najpierw przenieś je do innych grup.'
                                        : 'Usunięcie grupy odłączy jej przypisania. Konta klientów i historia wizyt pozostaną bez zmian.'}
                                    {childCount === 0 &&
                                    deleteMemberCount !== undefined
                                        ? ' Liczba przypisanych klientów: ' +
                                          deleteMemberCount +
                                          '.'
                                        : ''}
                                </p>
                                <div className={styles.reorderToolbar}>
                                    <button
                                        type="button"
                                        className={styles.danger}
                                        disabled={busy || childCount > 0}
                                        onClick={() => void deleteGroup()}
                                    >
                                        {remove.isPending
                                            ? 'Usuwanie…'
                                            : 'Potwierdź usunięcie'}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.secondary}
                                        disabled={busy}
                                        onClick={() => setPendingDeleteId(null)}
                                    >
                                        Anuluj
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <form
                        className={styles.form}
                        onSubmit={(event) => void save(event)}
                    >
                        <div className={styles.sectionHeading}>
                            <h3>
                                {editingId === null
                                    ? 'Nowa grupa'
                                    : 'Edycja grupy'}
                            </h3>
                            {editingId !== null ? (
                                <button
                                    className={styles.secondary}
                                    type="button"
                                    disabled={busy}
                                    onClick={startCreate}
                                >
                                    Nowa grupa
                                </button>
                            ) : null}
                        </div>
                        <label className={styles.field}>
                            <span>Nazwa grupy</span>
                            <input
                                value={draft.name}
                                onChange={(event) =>
                                    setDraft({
                                        ...draft,
                                        name: event.target.value,
                                    })
                                }
                                maxLength={100}
                                required
                                disabled={busy || isError}
                                placeholder="np. Stali klienci"
                            />
                        </label>
                        <label className={styles.field}>
                            <span>Opis (opcjonalnie)</span>
                            <textarea
                                value={draft.description}
                                onChange={(event) =>
                                    setDraft({
                                        ...draft,
                                        description: event.target.value,
                                    })
                                }
                                rows={2}
                                disabled={busy || isError}
                            />
                        </label>
                        <div className={styles.twoColumns}>
                            <label className={styles.field}>
                                <span>Grupa nadrzędna</span>
                                <select
                                    value={draft.parentId}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            parentId: event.target.value,
                                        })
                                    }
                                    disabled={busy || isError}
                                >
                                    <option value="">Bez nadrzędnej</option>
                                    {orderedGroups
                                        .filter(
                                            (group) => !forbidden.has(group.id),
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
                            </label>
                            <label className={styles.field}>
                                <span>Stały rabat (%)</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={draft.discountPercent}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            discountPercent: event.target.value,
                                        })
                                    }
                                    disabled={busy || isError}
                                    placeholder="Brak"
                                />
                            </label>
                        </div>
                        <label className={styles.colorField}>
                            <span>Kolor grupy</span>
                            <input
                                type="color"
                                value={draft.color}
                                onChange={(event) =>
                                    setDraft({
                                        ...draft,
                                        color: event.target.value,
                                    })
                                }
                                disabled={busy || isError}
                            />
                        </label>
                        {editingId === null &&
                        selectedCustomerIds.length > 0 ? (
                            <label className={styles.checkboxRow}>
                                <input
                                    type="checkbox"
                                    checked={draft.includeSelected}
                                    onChange={(event) =>
                                        setDraft({
                                            ...draft,
                                            includeSelected:
                                                event.target.checked,
                                        })
                                    }
                                    disabled={busy || isError}
                                />
                                <span>
                                    Przypisz zaznaczonych klientów z bieżącej
                                    strony ({selectedCustomerIds.length})
                                </span>
                            </label>
                        ) : null}
                        {duplicateName ? (
                            <p role="status" className={styles.hint}>
                                Grupa o tej nazwie już istnieje.
                            </p>
                        ) : null}
                        {!validDiscount ? (
                            <p role="alert" className={styles.error}>
                                Rabat musi wynosić od 0 do 100%.
                            </p>
                        ) : null}
                        <button
                            type="submit"
                            className={styles.primary}
                            disabled={!canSave}
                        >
                            {busy
                                ? 'Zapisywanie…'
                                : editingId === null
                                  ? 'Utwórz grupę'
                                  : 'Zapisz grupę'}
                        </button>
                    </form>
                </div>
                <p className={styles.hint}>
                    Kolejność zapisuje się dla grup o wspólnym rodzicu.
                    Usuwanie nie kasuje klientów, lecz usuwa przypisania
                    do danej grupy. Zmiany zapisują się w bazie DEV.
                </p>
            </section>
        </Modal>
    );
}
