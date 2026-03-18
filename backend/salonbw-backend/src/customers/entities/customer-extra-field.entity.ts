import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum ExtraFieldType {
    Text = 'text',
    Number = 'number',
    Date = 'date',
    Checkbox = 'checkbox',
    Select = 'select',
}

@Entity('customer_extra_fields')
export class CustomerExtraField {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    label: string;

    @Column({ type: 'enum', enum: ExtraFieldType, default: ExtraFieldType.Text })
    type: ExtraFieldType;

    @Column({ default: false })
    required: boolean;

    @Column({ name: 'sort_order', default: 0 })
    sortOrder: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
