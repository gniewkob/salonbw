import { applyDecorators } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto';

export function ApiErrorResponses() {
    return applyDecorators(
        ApiBadRequestResponse({
            description: 'Invalid request',
            type: ErrorResponseDto,
        }),
        ApiUnauthorizedResponse({
            description: 'Unauthorized',
            type: ErrorResponseDto,
        }),
        ApiForbiddenResponse({
            description: 'Forbidden',
            type: ErrorResponseDto,
        }),
        ApiNotFoundResponse({
            description: 'Not found',
            type: ErrorResponseDto,
        }),
    );
}
