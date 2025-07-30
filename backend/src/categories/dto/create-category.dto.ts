import { IsString, Length, IsOptional } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    @Length(2, 50)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
}
