import { useList } from './useList';
import { Service } from '@/types';

export function useServices() {
  return useList<Service>('/services');
}
