import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
    IsNumber,
    IsBoolean,
    IsOptional,
    IsArray,
    Min,
    Max,
} from 'class-validator';

export class CreateEmployeeServiceDto {
    @ApiProperty({ description: 'Employee ID' })
    @IsNumber()
    employeeId: number;

    @ApiProperty({ description: 'Service ID' })
    @IsNumber()
    serviceId: number;

    @ApiProperty({
        required: false,
        description: 'Custom duration for this employee (overrides service default)',
    })
    @IsNumber()
    @IsOptional()
    @Min(5)
    customDuration?: number;

    @ApiProperty({
        required: false,
        description: 'Custom price for this employee (overrides service default)',
    })
    @IsNumber()
    @IsOptional()
    @Min(0)
    customPrice?: number;

    @ApiProperty({
        required: false,
        description: 'Commission percentage for this employee on this service',
    })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    commissionPercent?: number;

    @ApiProperty({ required: false, default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateEmployeeServiceDto extends PartialType(CreateEmployeeServiceDto) {}

export class AssignEmployeesToServiceDto {
    @ApiProperty({
        description: 'Array of employee IDs to assign to the service',
        type: [Number],
    })
    @IsArray()
    @IsNumber({}, { each: true })
    employeeIds: number[];
}

export class AssignServicesToEmployeeDto {
    @ApiProperty({
        description: 'Array of service IDs to assign to the employee',
        type: [Number],
    })
    @IsArray()
    @IsNumber({}, { each: true })
    serviceIds: number[];
}
