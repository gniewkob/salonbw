import { ApiProperty } from '@nestjs/swagger';
import { EmployeeDto } from './employee.dto';

export class CreateEmployeeResponseDto {
    @ApiProperty({ type: () => EmployeeDto })
    employee: EmployeeDto;

    @ApiProperty({ description: 'Plaintext password, returned only once.' })
    password: string;
}
