import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ColumnNumericTransformer } from '../column-numeric.transformer';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    brand: string;

    @Column('decimal', { transformer: new ColumnNumericTransformer() })
    unitPrice: number;

    @Column('int')
    stock: number;
}
