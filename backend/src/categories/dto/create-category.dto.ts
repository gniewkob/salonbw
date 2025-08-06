import { IsString, Length, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
    @ApiProperty({
        description: 'Category name',
        type: String,
        minLength: 2,
        maxLength: 50,
        example: 'Hair Care',
    })
    @IsString()
    @Length(2, 50)
    name: string;

    @ApiPropertyOptional({
        description: 'Optional category description',
        type: String,
        example: 'Products for maintaining healthy hair',
    })
    @IsOptional()
    @IsString()
    description?: string;
}
