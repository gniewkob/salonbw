import {
    IsEmail,
    IsString,
    MinLength,
    IsOptional,
    Min,
    Matches,
    IsBoolean,
} from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    @Matches(/^\+?[1-9]\d{1,14}$/, {
        message: 'phone must be a valid international number',
    })
    phone?: string;

    @IsOptional()
    @Min(0)
    commissionBase?: number;

    @IsOptional()
    @IsBoolean()
    receiveNotifications?: boolean;
}
