import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    JoinTable,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('customer_groups')
export class CustomerGroup {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true, type: 'text' })
    description?: string;

    @Column({ nullable: true })
    color?: string;

    @Column({ nullable: true, type: 'int' })
    parentId?: number | null;

    @ManyToOne(() => CustomerGroup, (group) => group.children, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'parentId' })
    parent?: CustomerGroup | null;

    @OneToMany(() => CustomerGroup, (group) => group.parent)
    children?: CustomerGroup[];

    @Column({ type: 'int', default: 0 })
    sortOrder: number;

    @ManyToMany(() => User, (user) => user.groups)
    @JoinTable({
        name: 'customer_group_members',
        joinColumn: { name: 'groupId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
    })
    members: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
