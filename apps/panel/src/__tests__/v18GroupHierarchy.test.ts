import type { CustomerGroup } from '@/types';
import {
    buildV18GroupTree,
    flattenV18GroupSort,
    moveV18Group,
} from '@/utils/v18GroupHierarchy';

const groups: CustomerGroup[] = [
    {
        id: 7,
        name: 'Stali',
        parentId: null,
        sortOrder: 0,
        discountPercent: 8,
        members: [],
        createdAt: '2026-01-01',
    },
    {
        id: 8,
        name: 'Lojalni',
        parentId: null,
        sortOrder: 1,
        discountPercent: 5,
        createdAt: '2026-01-01',
    },
    {
        id: 9,
        name: 'VIP junior',
        parentId: 7,
        sortOrder: 0,
        discountPercent: 2,
        createdAt: '2026-01-01',
    },
    {
        id: 10,
        name: 'VIP senior',
        parentId: 7,
        sortOrder: 1,
        createdAt: '2026-01-01',
    },
];

describe('V18 CRM group hierarchy and sibling reorder', () => {
    it('displays nested groups in persisted sibling order', () => {
        const tree = buildV18GroupTree(groups);
        expect(tree.map((group) => group.id)).toEqual([7, 8]);
        expect(tree[0].children.map((group) => group.id)).toEqual([9, 10]);
    });

    it('moves only siblings, retaining parent and discount metadata', () => {
        const before = JSON.stringify(groups);
        const moved = moveV18Group(groups, 8, 'up');
        expect(moved).toEqual([
            { id: 8, parentId: null, sortOrder: 0 },
            { id: 7, parentId: null, sortOrder: 1 },
            { id: 9, parentId: 7, sortOrder: 0 },
            { id: 10, parentId: 7, sortOrder: 1 },
        ]);
        expect(JSON.stringify(groups)).toBe(before);
        expect(groups[0].discountPercent).toBe(8);
    });

    it('reorders child groups without moving them to a new parent', () => {
        expect(moveV18Group(groups, 10, 'up')).toEqual([
            { id: 7, parentId: null, sortOrder: 0 },
            { id: 10, parentId: 7, sortOrder: 0 },
            { id: 9, parentId: 7, sortOrder: 1 },
            { id: 8, parentId: null, sortOrder: 1 },
        ]);
    });

    it('ignores impossible moves and preserves a valid sort payload', () => {
        expect(moveV18Group(groups, 7, 'up')).toBeNull();
        expect(moveV18Group(groups, 9, 'up')).toBeNull();
        expect(moveV18Group(groups, 999, 'down')).toBeNull();
        expect(flattenV18GroupSort(buildV18GroupTree(groups))).toHaveLength(4);
    });
});
