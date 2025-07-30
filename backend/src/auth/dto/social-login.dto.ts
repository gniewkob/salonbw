import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SocialLoginDto {
    @ApiProperty({ enum: ['google', 'facebook', 'apple'] })
    @IsString()
    @IsIn(['google', 'facebook', 'apple'])
    provider: 'google' | 'facebook' | 'apple';

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    consentMarketing?: boolean;
}
