import { useList } from './useList';
import { Review } from '@/types';

export function useReviews() {
  return useList<Review>('/reviews');
}
