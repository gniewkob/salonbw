export type EntityRef<T extends { id: number }> = Pick<T, 'id'>;
