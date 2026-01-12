import * as crypto from 'crypto';

const globalWithCrypto = globalThis as unknown as {
    crypto?: { randomUUID?: () => string };
};

if (!globalWithCrypto.crypto) {
    globalWithCrypto.crypto = crypto as unknown as {
        randomUUID?: () => string;
    };
}

if (!globalWithCrypto.crypto.randomUUID) {
    globalWithCrypto.crypto.randomUUID = crypto.randomUUID;
}
