import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    brand: string;

    @Column('decimal', { precision: 10, scale: 2 })
    unitPrice: number;

    @Column('int')
    stock: number;
}
