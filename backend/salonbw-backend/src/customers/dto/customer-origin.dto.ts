import { IsString, Length } from 'class-validator';

export class CreateCustomerOriginDto {
    @IsString()
    @Length(1, 255)
    name: string;
}

export class UpdateCustomerOriginDto {
    @IsString()
    @Length(1, 255)
    name: string;
}
