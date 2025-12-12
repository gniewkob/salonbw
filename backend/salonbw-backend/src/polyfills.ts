import * as crypto from 'crypto';

if (!global.crypto) {
    // @ts-ignore
    global.crypto = crypto;
}
