'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export type CustomerFileCategory =
    | 'consent'
    | 'contract'
    | 'medical'
    | 'invoice'
    | 'other';

export type CustomerFileItem = {
    id: number;
    name: string;
    size: number;
    mimeType: string;
    category: CustomerFileCategory;
    description: string | null;
    createdAt: string;
    uploadedById: number | null;
    downloadUrl: string;
};

export type CustomerGalleryItem = {
    id: number;
    mimeType: string;
    size: number;
    description: string | null;
    serviceId: number | null;
    createdAt: string;
    uploadedById: number | null;
    url: string;
    thumbnailUrl: string;
};

export function getBrowserApiBase() {
    const raw = process.env.NEXT_PUBLIC_API_URL || '/api';
    return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

export function useCustomerFiles(customerId: number | null) {
    const { apiFetch } = useAuth();
    return useQuery<CustomerFileItem[]>({
        queryKey: ['customers', customerId, 'files'],
        queryFn: () =>
            apiFetch<CustomerFileItem[]>(`/customers/${customerId}/files`),
        enabled: customerId !== null,
    });
}

export function useUploadCustomerFile(customerId: number) {
    const { apiFetch } = useAuth();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (payload: {
            file: File;
            category: CustomerFileCategory;
            description?: string;
        }) => {
            const fd = new FormData();
            fd.append('file', payload.file);
            fd.append('category', payload.category);
            if (payload.description)
                fd.append('description', payload.description);
            return apiFetch<CustomerFileItem>(
                `/customers/${customerId}/files`,
                {
                    method: 'POST',
                    body: fd,
                },
            );
        },
        onSuccess: async () => {
            await qc.invalidateQueries({
                queryKey: ['customers', customerId, 'files'],
            });
        },
    });
}

export function useDeleteCustomerFile(customerId: number) {
    const { apiFetch } = useAuth();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (fileId: number) => {
            return apiFetch<{ success: boolean }>(
                `/customers/${customerId}/files/${fileId}`,
                { method: 'DELETE' },
            );
        },
        onSuccess: async () => {
            await qc.invalidateQueries({
                queryKey: ['customers', customerId, 'files'],
            });
        },
    });
}

export function useCustomerGallery(customerId: number | null) {
    const { apiFetch } = useAuth();
    return useQuery<CustomerGalleryItem[]>({
        queryKey: ['customers', customerId, 'gallery'],
        queryFn: () =>
            apiFetch<CustomerGalleryItem[]>(`/customers/${customerId}/gallery`),
        enabled: customerId !== null,
    });
}

export function useUploadCustomerGalleryImage(customerId: number) {
    const { apiFetch } = useAuth();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (payload: {
            image: File;
            description?: string;
            serviceId?: number;
        }) => {
            const fd = new FormData();
            fd.append('image', payload.image);
            if (payload.description)
                fd.append('description', payload.description);
            if (payload.serviceId)
                fd.append('serviceId', String(payload.serviceId));
            return apiFetch<CustomerGalleryItem>(
                `/customers/${customerId}/gallery`,
                {
                    method: 'POST',
                    body: fd,
                },
            );
        },
        onSuccess: async () => {
            await qc.invalidateQueries({
                queryKey: ['customers', customerId, 'gallery'],
            });
        },
    });
}

export function useDeleteCustomerGalleryImage(customerId: number) {
    const { apiFetch } = useAuth();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (imageId: number) => {
            return apiFetch<{ success: boolean }>(
                `/customers/${customerId}/gallery/${imageId}`,
                { method: 'DELETE' },
            );
        },
        onSuccess: async () => {
            await qc.invalidateQueries({
                queryKey: ['customers', customerId, 'gallery'],
            });
        },
    });
}
