import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../users/role.enum';

export class CustomerDto {
    @ApiProperty()
    @Expose()
    id: number;

    @ApiProperty()
    @Expose()
    email: string;

    @ApiProperty()
    @Expose()
    name: string;

    @ApiProperty({ nullable: true })
    @Expose()
    phone: string | null;

    @ApiProperty({ enum: Role })
    @Expose()
    role: Role;
}
