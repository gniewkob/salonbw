import { ApiProperty } from '@nestjs/swagger';
import { AuthTokensDto } from './auth-tokens.dto';

class SocialUserDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'user@example.com' })
    email: string;

    @ApiProperty({ example: 'Jane' })
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    lastName: string;

    @ApiProperty({ example: 'client' })
    role: string;
}

export class SocialLoginResponseDto extends AuthTokensDto {
    @ApiProperty({ description: 'Authenticated user information', type: SocialUserDto })
    user: SocialUserDto;
}

