import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
    @ApiProperty({ description: 'JWT refresh token', example: 'eyJhbGci...' })
    @IsString()
    refreshToken: string;
}
