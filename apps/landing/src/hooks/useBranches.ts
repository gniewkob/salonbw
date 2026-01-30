import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type {
    Branch,
    BranchMember,
    BranchStatus,
    CreateBranchRequest,
    UpdateBranchRequest,
    AddBranchMemberRequest,
    CrossBranchStats,
} from '@/types';

export const BRANCHES_QUERY_KEY = ['api', '/branches'] as const;

export function useBranches(params?: { status?: BranchStatus; city?: string }) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...BRANCHES_QUERY_KEY, params],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (params?.status) searchParams.append('status', params.status);
            if (params?.city) searchParams.append('city', params.city);
            const query = searchParams.toString();
            return apiFetch<Branch[]>(`/branches${query ? `?${query}` : ''}`);
        },
    });
}

export function useBranch(id: number | null) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...BRANCHES_QUERY_KEY, id],
        queryFn: async () => {
            return apiFetch<Branch>(`/branches/${id}`);
        },
        enabled: id !== null,
    });
}

export function useBranchBySlug(slug: string | null) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...BRANCHES_QUERY_KEY, 'slug', slug],
        queryFn: async () => {
            return apiFetch<Branch>(`/branches/slug/${slug}`);
        },
        enabled: slug !== null,
    });
}

export function useMyBranches() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...BRANCHES_QUERY_KEY, 'my'],
        queryFn: async () => {
            return apiFetch<Branch[]>('/branches/my');
        },
    });
}

export function useMyPrimaryBranch() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...BRANCHES_QUERY_KEY, 'my', 'primary'],
        queryFn: async () => {
            return apiFetch<Branch | null>('/branches/my/primary');
        },
    });
}

export function useBranchMembers(branchId: number | null) {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...BRANCHES_QUERY_KEY, branchId, 'members'],
        queryFn: async () => {
            return apiFetch<BranchMember[]>(`/branches/${branchId}/members`);
        },
        enabled: branchId !== null,
    });
}

export function useCrossBranchStats() {
    const { apiFetch } = useAuth();

    return useQuery({
        queryKey: [...BRANCHES_QUERY_KEY, 'stats', 'cross-branch'],
        queryFn: async () => {
            return apiFetch<CrossBranchStats>('/branches/stats/cross-branch');
        },
    });
}

export function useBranchesMutations() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: BRANCHES_QUERY_KEY });
    };

    const createBranch = useMutation({
        mutationFn: async (data: CreateBranchRequest) => {
            return apiFetch<Branch>('/branches', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        onSuccess: invalidate,
    });

    const updateBranch = useMutation({
        mutationFn: async ({ id, ...data }: UpdateBranchRequest & { id: number }) => {
            return apiFetch<Branch>(`/branches/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        onSuccess: invalidate,
    });

    const deleteBranch = useMutation({
        mutationFn: async (id: number) => {
            return apiFetch<void>(`/branches/${id}`, {
                method: 'DELETE',
            });
        },
        onSuccess: invalidate,
    });

    const addMember = useMutation({
        mutationFn: async ({
            branchId,
            ...data
        }: AddBranchMemberRequest & { branchId: number }) => {
            return apiFetch<BranchMember>(`/branches/${branchId}/members`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        onSuccess: invalidate,
    });

    const updateMember = useMutation({
        mutationFn: async ({
            branchId,
            userId,
            ...data
        }: {
            branchId: number;
            userId: number;
            branchRole?: string;
            isPrimary?: boolean;
            canManage?: boolean;
            isActive?: boolean;
        }) => {
            return apiFetch<BranchMember>(`/branches/${branchId}/members/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        onSuccess: invalidate,
    });

    const removeMember = useMutation({
        mutationFn: async ({ branchId, userId }: { branchId: number; userId: number }) => {
            return apiFetch<void>(`/branches/${branchId}/members/${userId}`, {
                method: 'DELETE',
            });
        },
        onSuccess: invalidate,
    });

    return {
        createBranch,
        updateBranch,
        deleteBranch,
        addMember,
        updateMember,
        removeMember,
    };
}
