import { IsString, IsBoolean, IsOptional, IsEnum, Length } from 'class-validator';
import { ExtraFieldType } from '../entities/customer-extra-field.entity';

export class CreateExtraFieldDto {
    @IsString()
    @Length(1, 255)
    label: string;

    @IsEnum(ExtraFieldType)
    type: ExtraFieldType;

    @IsOptional()
    @IsBoolean()
    required?: boolean;
}

export class UpdateExtraFieldDto {
    @IsOptional()
    @IsString()
    @Length(1, 255)
    label?: string;

    @IsOptional()
    @IsEnum(ExtraFieldType)
    type?: ExtraFieldType;

    @IsOptional()
    @IsBoolean()
    required?: boolean;
}
