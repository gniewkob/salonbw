import { Entity, PrimaryGeneratedColumn, Column, Check } from 'typeorm';

@Check('CHK_product_unit_price', '"unitPrice" >= 0')
@Check('CHK_product_stock', '"stock" >= 0')
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
