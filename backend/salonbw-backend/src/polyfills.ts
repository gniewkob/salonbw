import * as crypto from 'crypto';

const globalWithCrypto = globalThis as typeof globalThis & {
    crypto?: typeof crypto;
};

if (!globalWithCrypto.crypto) {
    globalWithCrypto.crypto = crypto;
}

if (!globalWithCrypto.crypto.randomUUID) {
    globalWithCrypto.crypto.randomUUID = crypto.randomUUID;
}
