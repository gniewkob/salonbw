import { registerDecorator, ValidationOptions } from 'class-validator';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const EU_COUNTRIES = [
    'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'
];

export function IsEuPhoneNumber(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isEuPhoneNumber',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    if (typeof value !== 'string') return false;
                    const phoneNumber = parsePhoneNumberFromString(value);
                    return (
                        phoneNumber?.isValid() === true &&
                        !!phoneNumber.country &&
                        EU_COUNTRIES.includes(phoneNumber.country)
                    );
                },
                defaultMessage() {
                    return '$property must be a valid EU phone number';
                },
            },
        });
    };
}
