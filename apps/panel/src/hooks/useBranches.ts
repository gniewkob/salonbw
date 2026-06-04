import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
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
    const toast = useToast();

    const invalidate = () => {
        void queryClient.invalidateQueries({ queryKey: BRANCHES_QUERY_KEY });
    };
    const withFeedback = (label: string, errorLabel: string) => ({
        onSuccess: () => {
            invalidate();
            toast.success(label);
        },
        onError: () => {
            toast.error(errorLabel);
        },
    });

    const createBranch = useMutation({
        mutationFn: async (data: CreateBranchRequest) => {
            return apiFetch<Branch>('/branches', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        ...withFeedback('Salon dodany', 'Nie udało się dodać salonu'),
    });

    const updateBranch = useMutation({
        mutationFn: async ({
            id,
            ...data
        }: UpdateBranchRequest & { id: number }) => {
            return apiFetch<Branch>(`/branches/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        ...withFeedback('Salon zapisany', 'Nie udało się zapisać salonu'),
    });

    const deleteBranch = useMutation({
        mutationFn: async (id: number) => {
            return apiFetch<void>(`/branches/${id}`, {
                method: 'DELETE',
            });
        },
        ...withFeedback('Salon usunięty', 'Nie udało się usunąć salonu'),
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
        ...withFeedback(
            'Dodano członka zespołu',
            'Nie udało się dodać członka zespołu',
        ),
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
            return apiFetch<BranchMember>(
                `/branches/${branchId}/members/${userId}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(data),
                },
            );
        },
        ...withFeedback('Zmiany zapisane', 'Nie udało się zapisać zmian'),
    });

    const removeMember = useMutation({
        mutationFn: async ({
            branchId,
            userId,
        }: {
            branchId: number;
            userId: number;
        }) => {
            return apiFetch<void>(`/branches/${branchId}/members/${userId}`, {
                method: 'DELETE',
            });
        },
        ...withFeedback(
            'Członek zespołu usunięty',
            'Nie udało się usunąć członka zespołu',
        ),
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
