import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    ArrayNotEmpty,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
} from 'class-validator';

export class SendBulkEmailDto {
    @ApiProperty({ description: 'Recipient email addresses' })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    recipients: string[];

    @ApiProperty({ description: 'Email subject' })
    @IsString()
    @IsNotEmpty()
    subject: string;

    @ApiProperty({
        description: 'Email template content with {{placeholders}}',
    })
    @IsString()
    @IsNotEmpty()
    template: string;

    @ApiProperty({
        description: 'Data for template placeholders (same for all recipients)',
        required: false,
    })
    @IsOptional()
    @IsObject()
    data?: Record<string, string>;
}
