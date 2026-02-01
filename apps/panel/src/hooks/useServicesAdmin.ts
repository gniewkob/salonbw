import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type {
    Service,
    ServiceCategory,
    ServiceVariant,
    EmployeeService,
    PriceType,
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
    duration: number;
    price: number;
    priceType?: PriceType;
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
        }: {
            serviceId: number;
            employeeIds: number[];
        }) =>
            apiFetch<EmployeeService[]>(
                `/employee-services/service/${serviceId}/assign-employees`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ employeeIds }),
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
