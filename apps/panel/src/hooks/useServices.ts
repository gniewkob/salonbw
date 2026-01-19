import type { paths } from '@salonbw/api';
import type { Service as LocalService } from '@/types';
import { useList } from './useList';

type ServicesResponse =
    paths['/services']['get']['responses']['200']['content']['application/json'];
type Service =
    ServicesResponse extends Array<infer Item>
        ? LocalService & Item
        : LocalService;

export function useServices() {
    return useList<Service>('/services');
}
