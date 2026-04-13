import { IsDateString, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JpkExportDto {
    @ApiProperty({ description: 'Start date (YYYY-MM-DD)' })
    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @ApiProperty({ description: 'End date (YYYY-MM-DD)' })
    @IsDateString()
    @IsNotEmpty()
    endDate: string;

    @ApiProperty({ description: 'Company NIP number' })
    @IsString()
    @IsNotEmpty()
    nip: string;

    @ApiProperty({ description: 'Company full name' })
    @IsString()
    @IsNotEmpty()
    companyName: string;

    @ApiProperty({ description: 'Company email' })
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ description: 'Company address' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({ description: 'Tax office code (e.g., 1208)' })
    @IsString()
    @IsNotEmpty()
    taxOfficeCode: string;
}

export class JpkSingleExportDto {
    @ApiProperty({ description: 'Company NIP number' })
    @IsString()
    @IsNotEmpty()
    nip: string;

    @ApiProperty({ description: 'Company full name' })
    @IsString()
    @IsNotEmpty()
    companyName: string;

    @ApiProperty({ description: 'Company email' })
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ description: 'Company address' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({ description: 'Tax office code (e.g., 1208)' })
    @IsString()
    @IsNotEmpty()
    taxOfficeCode: string;
}
