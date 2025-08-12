import { ValueTransformer } from 'typeorm';

export class ColumnNumericTransformer implements ValueTransformer {
    to(data?: number | null): number | null {
        return data === null || data === undefined ? null : data;
    }

    from(data?: string | number | null): number | null {
        if (data === null || data === undefined) {
            return null;
        }
        return typeof data === 'number' ? data : Number(data);
    }
}
