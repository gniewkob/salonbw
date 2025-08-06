import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SocialLoginDto {
    @ApiProperty({
        description: 'Social provider used for authentication',
        enum: ['google', 'facebook', 'apple'],
        example: 'google',
    })
    @IsString()
    @IsIn(['google', 'facebook', 'apple'])
    provider: 'google' | 'facebook' | 'apple';

    @ApiProperty({
        description: 'Token issued by the social provider',
        type: String,
        example: 'ya29.a0AfH6SMA...',
    })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({
        description: 'Marketing consent provided during social login',
        required: false,
        type: Boolean,
        example: true,
    })
    @IsBoolean()
    @IsOptional()
    marketingConsent?: boolean;
}
