import { IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSaleDto {
    @ApiProperty({
        description: 'Identifier of the purchasing client',
        type: Number,
        example: 1,
    })
    @IsInt()
    clientId: number;

    @ApiProperty({
        description: 'Identifier of the employee processing the sale',
        type: Number,
        example: 2,
    })
    @IsInt()
    employeeId: number;

    @ApiProperty({
        description: 'Identifier of the product sold',
        type: Number,
        example: 3,
    })
    @IsInt()
    productId: number;

    @ApiProperty({
        description: 'Quantity of product sold',
        type: Number,
        minimum: 1,
        example: 2,
    })
    @IsInt()
    @Min(1)
    quantity: number;

    @ApiPropertyOptional({
        description: 'Optional related appointment identifier',
        type: Number,
        example: 10,
    })
    @IsInt()
    @IsOptional()
    appointmentId?: number;
}
