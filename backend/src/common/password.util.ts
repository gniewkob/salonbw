import { randomBytes } from 'crypto';

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';

export function generateStrongPassword(length = 12): string {
    const bytes = randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
        password += CHARSET[bytes[i] % CHARSET.length];
    }
    return password;
}
