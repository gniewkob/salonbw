import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ColumnNumericTransformer } from '../column-numeric.transformer';

@Entity('products')
export class Product {
    @ApiProperty()
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty()
    @Column()
    name: string;

    @ApiProperty()
    @Column()
    brand: string;

    @ApiProperty()
    @Column('decimal', { transformer: new ColumnNumericTransformer() })
    unitPrice: number;

    @ApiProperty()
    @Column('int')
    stock: number;
}
