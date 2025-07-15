import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterClientDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @MinLength(6)
    password: string;

    @IsString()
    name: string;
}
