import { Entity, Column } from 'typeorm';
import { User } from '../users/user.entity';
import { EmployeeRole } from './employee-role.enum';

// Employee accounts share the same table as regular users
// but are typed separately for clarity.
@Entity('user')
export class Employee extends User {
    @Column({
        type: 'enum',
        enum: EmployeeRole,
        default: EmployeeRole.FRYZJER,
    })
    declare role: EmployeeRole;
}
