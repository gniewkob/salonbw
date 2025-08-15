import { IsEmail, IsString, MinLength, IsOptional, Min } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsString()
    name: string;

    @IsOptional()
    @Min(0)
    commissionBase?: number;
}
