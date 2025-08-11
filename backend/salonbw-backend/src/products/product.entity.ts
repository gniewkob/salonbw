import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    brand: string;

    @Column('decimal')
    unitPrice: number;

    @Column('int')
    stock: number;
}
