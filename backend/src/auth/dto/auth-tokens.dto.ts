import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
    @ApiProperty()
    access_token: string;

    @ApiProperty()
    refresh_token: string;
}
