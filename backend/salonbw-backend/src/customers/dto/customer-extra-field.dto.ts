import {
    ArrayNotEmpty,
    IsArray,
    IsString,
    IsBoolean,
    IsOptional,
    IsEnum,
    Length,
    ValidateIf,
} from 'class-validator';
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

    @IsOptional()
    @ValidateIf((o) => o.type === ExtraFieldType.Select)
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    @Length(1, 255, { each: true })
    options?: string[];
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

    @IsOptional()
    @ValidateIf(
        (o) => o.type === ExtraFieldType.Select || o.options !== undefined,
    )
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    @Length(1, 255, { each: true })
    options?: string[];
}
