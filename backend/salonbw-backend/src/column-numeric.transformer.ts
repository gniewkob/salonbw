import { ValueTransformer } from 'typeorm';

export class ColumnNumericTransformer implements ValueTransformer {
    to(data?: number | null): number | null | undefined {
        // undefined must STAY undefined: mapping it to null made TypeORM
        // send an explicit NULL instead of using the column DEFAULT, which
        // broke inserts into NOT NULL DEFAULT columns (POST /deliveries
        // 500'd on totalCost). null remains an intentional explicit NULL.
        if (data === undefined) {
            return undefined;
        }
        return data;
    }

    from(data?: string | number | null): number | null {
        if (data === null || data === undefined) {
            return null;
        }
        return typeof data === 'number' ? data : Number(data);
    }
}
