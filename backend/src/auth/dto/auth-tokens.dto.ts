import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
    @ApiProperty({
        description: 'JWT access token',
        type: String,
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    })
    access_token: string;

    @ApiProperty({
        description: 'JWT refresh token',
        type: String,
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    })
    refresh_token: string;
}
