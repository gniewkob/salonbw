import type { CustomerGroup } from '@/types';

export type V18GroupNode = CustomerGroup & { children: V18GroupNode[] };
export type V18GroupSortItem = {
    id: number;
    parentId: number | null;
    sortOrder: number;
};

const compareGroups = (a: CustomerGroup, b: CustomerGroup) =>
    (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
    a.name.localeCompare(b.name, 'pl') ||
    a.id - b.id;

/** Keep a stable, deterministic hierarchy without mutating API objects. */
export function buildV18GroupTree(groups: CustomerGroup[]): V18GroupNode[] {
    const byId = new Map<number, V18GroupNode>();
    const roots: V18GroupNode[] = [];

    for (const group of groups) {
        byId.set(group.id, { ...group, children: [] });
    }

    for (const group of groups) {
        const node = byId.get(group.id);
        if (!node) continue;
        const parent = group.parentId ? byId.get(group.parentId) : undefined;
        // Malformed self-parent references are displayed as roots, not hidden.
        if (parent && parent.id !== group.id) parent.children.push(node);
        else roots.push(node);
    }

    const sortNodes = (nodes: V18GroupNode[]) => {
        nodes.sort(compareGroups);
        for (const node of nodes) sortNodes(node.children);
    };

    sortNodes(roots);
    return roots;
}

export function flattenV18GroupSort(nodes: V18GroupNode[]): V18GroupSortItem[] {
    return nodes.flatMap((node, index) => [
        {
            id: node.id,
            parentId: node.parentId ?? null,
            sortOrder: index,
        },
        ...flattenV18GroupSort(node.children),
    ]);
}

/**
 * Move only among siblings. Preserve parent IDs, discounts, member links
 * and all other group metadata. Return null for an impossible movement.
 */
export function moveV18Group(
    groups: CustomerGroup[],
    groupId: number,
    direction: 'up' | 'down',
): V18GroupSortItem[] | null {
    const roots = buildV18GroupTree(groups);
    let moved = false;

    const moveWithin = (siblings: V18GroupNode[]): void => {
        const index = siblings.findIndex((item) => item.id === groupId);
        if (index >= 0) {
            const to = direction === 'up' ? index - 1 : index + 1;
            if (to < 0 || to >= siblings.length) return;
            const [item] = siblings.splice(index, 1);
            siblings.splice(to, 0, item);
            moved = true;
            return;
        }
        for (const item of siblings) {
            moveWithin(item.children);
            if (moved) return;
        }
    };
    moveWithin(roots);

    return moved ? flattenV18GroupSort(roots) : null;
}
