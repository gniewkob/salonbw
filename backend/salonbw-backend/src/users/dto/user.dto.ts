import { Role } from '../role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
    @ApiProperty({ description: 'Unique identifier', example: 1 })
    id: number;

    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
    })
    email: string;

    @ApiProperty({ description: 'User full name', example: 'John Doe' })
    name: string;

    @ApiProperty({ description: 'User role', enum: Role, example: Role.Client })
    role: Role;

    @ApiProperty({
        description: 'International phone number',
        example: '+123456789',
        nullable: true,
    })
    phone: string | null;

    @ApiProperty({ description: 'Commission base for the user', example: 0 })
    commissionBase: number;

    @ApiProperty({
        description: 'Whether the user receives notifications',
        example: true,
    })
    receiveNotifications: boolean;
}
