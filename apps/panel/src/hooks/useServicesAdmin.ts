import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type {
    Service,
    ServiceCategory,
    ServiceVariant,
    EmployeeService,
    PriceType,
    ServiceMedia,
    ServiceReview,
    ServiceReviewSource,
    ServiceRecipeItem,
} from '@/types';

// ==================== Service Categories ====================

export function useServiceCategories() {
    const { apiFetch } = useAuth();
    return useQuery<ServiceCategory[]>({
        queryKey: ['service-categories'],
        queryFn: () => apiFetch<ServiceCategory[]>('/service-categories'),
    });
}

export function useServiceCategoryTree() {
    const { apiFetch } = useAuth();
    return useQuery<ServiceCategory[]>({
        queryKey: ['service-categories', 'tree'],
        queryFn: () => apiFetch<ServiceCategory[]>('/service-categories/tree'),
    });
}

export function useServiceCategory(id: number) {
    const { apiFetch } = useAuth();
    return useQuery<ServiceCategory>({
        queryKey: ['service-categories', id],
        queryFn: () => apiFetch<ServiceCategory>(`/service-categories/${id}`),
        enabled: !!id,
    });
}

export interface CreateServiceCategoryDto {
    name: string;
    description?: string;
    color?: string;
    parentId?: number;
    sortOrder?: number;
    isActive?: boolean;
}

export function useCreateServiceCategory() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateServiceCategoryDto) =>
            apiFetch<ServiceCategory>('/service-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['service-categories'],
            });
        },
    });
}

export function useUpdateServiceCategory() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: number;
            data: Partial<CreateServiceCategoryDto>;
        }) =>
            apiFetch<ServiceCategory>(`/service-categories/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['service-categories'],
            });
        },
    });
}

export function useDeleteServiceCategory() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) =>
            apiFetch<void>(`/service-categories/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['service-categories'],
            });
        },
    });
}

export function useReorderCategories() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (categoryIds: number[]) =>
            apiFetch<void>('/service-categories/reorder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryIds }),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['service-categories'],
            });
        },
    });
}

// ==================== Services ====================

export interface ServiceQueryOptions {
    categoryId?: number;
    isActive?: boolean;
    onlineBooking?: boolean;
    includeVariants?: boolean;
    includeCategory?: boolean;
}

export function useServicesWithFilters(options?: ServiceQueryOptions) {
    const { apiFetch } = useAuth();
    const params = new URLSearchParams();
    if (options?.categoryId)
        params.append('categoryId', String(options.categoryId));
    if (options?.isActive !== undefined)
        params.append('isActive', String(options.isActive));
    if (options?.onlineBooking !== undefined)
        params.append('onlineBooking', String(options.onlineBooking));
    if (options?.includeVariants) params.append('includeVariants', 'true');
    if (options?.includeCategory) params.append('includeCategory', 'true');

    const queryString = params.toString();

    return useQuery<Service[]>({
        queryKey: ['services', options],
        queryFn: () =>
            apiFetch<Service[]>(
                `/services${queryString ? `?${queryString}` : ''}`,
            ),
    });
}

export function useServicesWithRelations() {
    const { apiFetch } = useAuth();
    return useQuery<Service[]>({
        queryKey: ['services', 'with-relations'],
        queryFn: () => apiFetch<Service[]>('/services/with-relations'),
    });
}

export function useService(id: number) {
    const { apiFetch } = useAuth();
    return useQuery<Service>({
        queryKey: ['services', id],
        queryFn: () => apiFetch<Service>(`/services/${id}`),
        enabled: !!id,
    });
}

export interface CreateServiceDto {
    name: string;
    description?: string;
    publicDescription?: string;
    privateDescription?: string;
    duration: number;
    price: number;
    priceType?: PriceType;
    vatRate?: number;
    isFeatured?: boolean;
    category?: string;
    categoryId?: number;
    commissionPercent?: number;
    isActive?: boolean;
    onlineBooking?: boolean;
    sortOrder?: number;
}

export function useCreateService() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateServiceDto) =>
            apiFetch<Service>('/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['services'] });
        },
    });
}

export function useUpdateService() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: number;
            data: Partial<CreateServiceDto>;
        }) =>
            apiFetch<Service>(`/services/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: (_, { id }) => {
            void queryClient.invalidateQueries({ queryKey: ['services'] });
            void queryClient.invalidateQueries({ queryKey: ['services', id] });
        },
    });
}

export function useDeleteService() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) =>
            apiFetch<void>(`/services/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['services'] });
        },
    });
}

export function useReorderServices() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (serviceIds: number[]) =>
            apiFetch<void>('/services/reorder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceIds }),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['services'] });
        },
    });
}

// ==================== Service Variants ====================

export function useServiceVariants(serviceId: number | null) {
    const { apiFetch } = useAuth();
    return useQuery<ServiceVariant[]>({
        queryKey: ['service-variants', serviceId],
        queryFn: () =>
            apiFetch<ServiceVariant[]>(`/services/${serviceId}/variants`),
        enabled: serviceId !== null && serviceId > 0,
    });
}

export interface CreateServiceVariantDto {
    name: string;
    description?: string;
    duration: number;
    price: number;
    priceType?: PriceType;
    sortOrder?: number;
    isActive?: boolean;
}

export function useCreateServiceVariant() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            serviceId,
            data,
        }: {
            serviceId: number;
            data: CreateServiceVariantDto;
        }) =>
            apiFetch<ServiceVariant>(`/services/${serviceId}/variants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: (_, { serviceId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['service-variants', serviceId],
            });
            void queryClient.invalidateQueries({ queryKey: ['services'] });
        },
    });
}

export function useUpdateServiceVariant() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            serviceId,
            variantId,
            data,
        }: {
            serviceId: number;
            variantId: number;
            data: Partial<CreateServiceVariantDto>;
        }) =>
            apiFetch<ServiceVariant>(
                `/services/${serviceId}/variants/${variantId}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                },
            ),
        onSuccess: (_, { serviceId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['service-variants', serviceId],
            });
            void queryClient.invalidateQueries({ queryKey: ['services'] });
        },
    });
}

export function useDeleteServiceVariant() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            serviceId,
            variantId,
        }: {
            serviceId: number;
            variantId: number;
        }) =>
            apiFetch<void>(`/services/${serviceId}/variants/${variantId}`, {
                method: 'DELETE',
            }),
        onSuccess: (_, { serviceId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['service-variants', serviceId],
            });
            void queryClient.invalidateQueries({ queryKey: ['services'] });
        },
    });
}

export function useReorderVariants() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            serviceId,
            variantIds,
        }: {
            serviceId: number;
            variantIds: number[];
        }) =>
            apiFetch<void>(`/services/${serviceId}/variants/reorder`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ variantIds }),
            }),
        onSuccess: (_, { serviceId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['service-variants', serviceId],
            });
        },
    });
}

// ==================== Employee-Service Assignments ====================

export function useEmployeeServices(employeeId: number) {
    const { apiFetch } = useAuth();
    return useQuery<EmployeeService[]>({
        queryKey: ['employee-services', 'employee', employeeId],
        queryFn: () =>
            apiFetch<EmployeeService[]>(
                `/employee-services/employee/${employeeId}`,
            ),
        enabled: !!employeeId,
    });
}

export function useServiceEmployees(serviceId: number) {
    const { apiFetch } = useAuth();
    return useQuery<EmployeeService[]>({
        queryKey: ['employee-services', 'service', serviceId],
        queryFn: () =>
            apiFetch<EmployeeService[]>(
                `/employee-services/service/${serviceId}`,
            ),
        enabled: !!serviceId,
    });
}

export function useServicesForEmployee(employeeId: number) {
    const { apiFetch } = useAuth();
    return useQuery<Service[]>({
        queryKey: ['employee-services', 'employee', employeeId, 'services'],
        queryFn: () =>
            apiFetch<Service[]>(
                `/employee-services/employee/${employeeId}/services`,
            ),
        enabled: !!employeeId,
    });
}

export interface CreateEmployeeServiceDto {
    employeeId: number;
    serviceId: number;
    serviceVariantId?: number | null;
    customDuration?: number;
    customPrice?: number;
    commissionPercent?: number;
    isActive?: boolean;
}

export function useCreateEmployeeService() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateEmployeeServiceDto) =>
            apiFetch<EmployeeService>('/employee-services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: (_, data) => {
            void queryClient.invalidateQueries({
                queryKey: ['employee-services', 'employee', data.employeeId],
            });
            void queryClient.invalidateQueries({
                queryKey: ['employee-services', 'service', data.serviceId],
            });
        },
    });
}

export function useUpdateEmployeeService() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: number;
            data: Partial<CreateEmployeeServiceDto>;
        }) =>
            apiFetch<EmployeeService>(`/employee-services/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['employee-services'],
            });
        },
    });
}

export function useDeleteEmployeeService() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) =>
            apiFetch<void>(`/employee-services/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['employee-services'],
            });
        },
    });
}

export function useAssignEmployeesToService() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            serviceId,
            employeeIds,
            serviceVariantId,
        }: {
            serviceId: number;
            employeeIds: number[];
            serviceVariantId?: number | null;
        }) =>
            apiFetch<EmployeeService[]>(
                `/employee-services/service/${serviceId}/assign-employees`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ employeeIds, serviceVariantId }),
                },
            ),
        onSuccess: (_, { serviceId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['employee-services', 'service', serviceId],
            });
            void queryClient.invalidateQueries({
                queryKey: ['employee-services'],
            });
        },
    });
}

export function useAssignServicesToEmployee() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            employeeId,
            serviceIds,
        }: {
            employeeId: number;
            serviceIds: number[];
        }) =>
            apiFetch<EmployeeService[]>(
                `/employee-services/employee/${employeeId}/assign-services`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ serviceIds }),
                },
            ),
        onSuccess: (_, { employeeId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['employee-services', 'employee', employeeId],
            });
            void queryClient.invalidateQueries({
                queryKey: ['employee-services'],
            });
        },
    });
}

// ==================== Service Details ====================

export function useServiceSummary(serviceId: number) {
    const { apiFetch } = useAuth();
    return useQuery<Service>({
        queryKey: ['services', serviceId, 'summary'],
        queryFn: () => apiFetch<Service>(`/services/${serviceId}/summary`),
        enabled: !!serviceId,
    });
}

export interface ServiceStatsResponse {
    totalRevenue: number;
    totalCount: number;
    data: Array<{
        date: string;
        label: string;
        revenue: number;
        appointments: number;
    }>;
}

export function useServiceStats(
    serviceId: number,
    params?: { from?: string; to?: string; groupBy?: 'day' | 'week' | 'month' },
) {
    const { apiFetch } = useAuth();
    const qs = new URLSearchParams();
    if (params?.from) qs.append('from', params.from);
    if (params?.to) qs.append('to', params.to);
    if (params?.groupBy) qs.append('groupBy', params.groupBy);
    const query = qs.toString();
    return useQuery<ServiceStatsResponse>({
        queryKey: ['services', serviceId, 'stats', params],
        queryFn: () =>
            apiFetch<ServiceStatsResponse>(
                `/services/${serviceId}/stats${query ? `?${query}` : ''}`,
            ),
        enabled: !!serviceId,
    });
}

export interface ServiceHistoryResponse {
    items: Array<{
        id: number;
        startTime: string;
        endTime: string;
        status: string;
        client?: { id: number; name: string };
        employee?: { id: number; name: string };
        serviceVariant?: ServiceVariant | null;
        paidAmount?: number | null;
    }>;
    total: number;
    page: number;
    limit: number;
}

export function useServiceHistory(
    serviceId: number,
    params?: { page?: number; limit?: number; from?: string; to?: string },
) {
    const { apiFetch } = useAuth();
    const qs = new URLSearchParams();
    if (params?.page) qs.append('page', String(params.page));
    if (params?.limit) qs.append('limit', String(params.limit));
    if (params?.from) qs.append('from', params.from);
    if (params?.to) qs.append('to', params.to);
    const query = qs.toString();
    return useQuery<ServiceHistoryResponse>({
        queryKey: ['services', serviceId, 'history', params],
        queryFn: () =>
            apiFetch<ServiceHistoryResponse>(
                `/services/${serviceId}/history${query ? `?${query}` : ''}`,
            ),
        enabled: !!serviceId,
    });
}

export function useServiceEmployeesDetails(serviceId: number) {
    const { apiFetch } = useAuth();
    return useQuery<EmployeeService[]>({
        queryKey: ['services', serviceId, 'employees'],
        queryFn: () => apiFetch<EmployeeService[]>(`/services/${serviceId}/employees`),
        enabled: !!serviceId,
    });
}

export function useServiceComments(
    serviceId: number,
    source?: ServiceReviewSource,
) {
    const { apiFetch } = useAuth();
    const qs = source ? `?source=${source}` : '';
    return useQuery<ServiceReview[]>({
        queryKey: ['services', serviceId, 'comments', source],
        queryFn: () =>
            apiFetch<ServiceReview[]>(`/services/${serviceId}/comments${qs}`),
        enabled: !!serviceId,
    });
}

export function useAddServiceComment() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            serviceId,
            data,
        }: {
            serviceId: number;
            data: {
                source?: ServiceReviewSource;
                rating: number;
                comment?: string;
                authorName?: string;
            };
        }) =>
            apiFetch<ServiceReview>(`/services/${serviceId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: (_, { serviceId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['services', serviceId, 'comments'],
            });
        },
    });
}

export function useDeleteServiceComment() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            serviceId,
            commentId,
        }: {
            serviceId: number;
            commentId: number;
        }) =>
            apiFetch<void>(`/services/${serviceId}/comments/${commentId}`, {
                method: 'DELETE',
            }),
        onSuccess: (_, { serviceId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['services', serviceId, 'comments'],
            });
        },
    });
}

export function useServicePhotos(serviceId: number) {
    const { apiFetch } = useAuth();
    return useQuery<ServiceMedia[]>({
        queryKey: ['services', serviceId, 'photos'],
        queryFn: () => apiFetch<ServiceMedia[]>(`/services/${serviceId}/photos`),
        enabled: !!serviceId,
    });
}

export function useAddServicePhoto() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            serviceId,
            data,
        }: {
            serviceId: number;
            data: {
                url: string;
                caption?: string;
                sortOrder?: number;
                isPublic?: boolean;
            };
        }) =>
            apiFetch<ServiceMedia>(`/services/${serviceId}/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }),
        onSuccess: (_, { serviceId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['services', serviceId, 'photos'],
            });
        },
    });
}

export function useDeleteServicePhoto() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            serviceId,
            photoId,
        }: {
            serviceId: number;
            photoId: number;
        }) =>
            apiFetch<void>(`/services/${serviceId}/photos/${photoId}`, {
                method: 'DELETE',
            }),
        onSuccess: (_, { serviceId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['services', serviceId, 'photos'],
            });
        },
    });
}

export function useServiceRecipe(serviceId: number) {
    const { apiFetch } = useAuth();
    return useQuery<ServiceRecipeItem[]>({
        queryKey: ['services', serviceId, 'recipe'],
        queryFn: () => apiFetch<ServiceRecipeItem[]>(`/services/${serviceId}/recipe`),
        enabled: !!serviceId,
    });
}

export function useUpdateServiceRecipe() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            serviceId,
            items,
        }: {
            serviceId: number;
            items: Array<{
                serviceVariantId?: number | null;
                productId?: number | null;
                quantity?: number | null;
                unit?: string | null;
                notes?: string | null;
            }>;
        }) =>
            apiFetch<ServiceRecipeItem[]>(`/services/${serviceId}/recipe`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            }),
        onSuccess: (_, { serviceId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['services', serviceId, 'recipe'],
            });
        },
    });
}

export interface CommissionRuleItem {
    id?: number;
    employeeId: number;
    commissionPercent: number;
}

export function useServiceCommissions(serviceId: number) {
    const { apiFetch } = useAuth();
    return useQuery<CommissionRuleItem[]>({
        queryKey: ['services', serviceId, 'commissions'],
        queryFn: () =>
            apiFetch<CommissionRuleItem[]>(`/services/${serviceId}/commissions`),
        enabled: !!serviceId,
    });
}

export function useUpdateServiceCommissions() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            serviceId,
            rules,
        }: {
            serviceId: number;
            rules: CommissionRuleItem[];
        }) =>
            apiFetch<CommissionRuleItem[]>(
                `/services/${serviceId}/commissions`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rules }),
                },
            ),
        onSuccess: (_, { serviceId }) => {
            void queryClient.invalidateQueries({
                queryKey: ['services', serviceId, 'commissions'],
            });
        },
    });
}
