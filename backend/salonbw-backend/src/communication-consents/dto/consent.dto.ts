import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Length,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import {
    CommunicationChannel,
    CommunicationType,
    ConsentPurpose,
    ConsentSource,
} from '../communication-consent.types';

export class ConsentScopeDto {
    @ApiProperty({ enum: ConsentPurpose })
    @IsEnum(ConsentPurpose)
    purpose: ConsentPurpose;

    @ApiProperty({ enum: CommunicationChannel })
    @IsEnum(CommunicationChannel)
    channel: CommunicationChannel;
}

/**
 * Grant body. For staff: source (one of the evidence-bearing sources) and
 * evidenceReference are mandatory. For self-service both are ignored and set
 * by the server from the authenticated session.
 */
export class GrantConsentDto extends ConsentScopeDto {
    @ApiProperty({
        description: 'Must equal the current statement version for the scope',
    })
    @IsString()
    @Length(1, 80)
    consentTextVersion: string;

    @ApiPropertyOptional({ enum: ConsentSource })
    @IsOptional()
    @IsEnum(ConsentSource)
    source?: ConsentSource;

    @ApiPropertyOptional({
        description:
            'Staff only: reference to real evidence (form number, e-mail id, call recording id)',
    })
    @IsOptional()
    @IsString()
    @Length(3, 500)
    evidenceReference?: string;

    @ApiPropertyOptional({
        description: 'Staff only: when the customer actually consented (≤ now)',
    })
    @IsOptional()
    @IsDateString()
    consentGivenAt?: string;
}

export class WithdrawConsentDto extends ConsentScopeDto {}

export class PreferenceChangeDto {
    @ApiProperty({ enum: CommunicationType })
    @IsEnum(CommunicationType)
    communicationType: CommunicationType;

    @ApiProperty({ enum: CommunicationChannel })
    @IsEnum(CommunicationChannel)
    channel: CommunicationChannel;

    @ApiProperty()
    @IsBoolean()
    enabled: boolean;
}

export class UpdatePreferencesDto {
    @ApiProperty({ type: [PreferenceChangeDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(60)
    @ValidateNested({ each: true })
    @Type(() => PreferenceChangeDto)
    changes: PreferenceChangeDto[];
}

/** Initial consent state captured in the customer-creation form. */
export class InitialConsentGrantDto extends ConsentScopeDto {
    @IsString()
    @Length(1, 80)
    consentTextVersion: string;
}

export class InitialCommunicationSetupDto {
    @ApiPropertyOptional({ type: [InitialConsentGrantDto] })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @ValidateNested({ each: true })
    @Type(() => InitialConsentGrantDto)
    grants?: InitialConsentGrantDto[];

    @ApiPropertyOptional({
        enum: ConsentSource,
        description: 'Required when grants are present',
    })
    @IsOptional()
    @IsEnum(ConsentSource)
    source?: ConsentSource;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(3, 500)
    evidenceReference?: string;

    @ApiPropertyOptional({ type: [PreferenceChangeDto] })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(60)
    @ValidateNested({ each: true })
    @Type(() => PreferenceChangeDto)
    preferences?: PreferenceChangeDto[];
}

export class ConsentHistoryQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}
