import { Entity, Index } from 'typeorm';
import { User } from '../users/user.entity';

// Customer accounts share the same table as regular users
// (with first and last name fields) but are typed separately for clarity.
@Index(['email'], { unique: true })
@Entity('user')
export class Customer extends User {}
