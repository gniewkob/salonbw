import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
    @ApiProperty({
        description: 'Refresh token issued during authentication',
        type: String,
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    })
    refresh_token: string;
}
