'use strict';

const numeric = '0123456789';
const alphaLower = 'abcdefghijklmnopqrstuvwxyz';
const alphaUpper = alphaLower.toUpperCase();
const alphaNumeric = numeric + alphaUpper + alphaLower;

function assert(condition, message) {
    if (!condition) {
        throw new Error(message ?? 'Assertion failed');
    }
}

function resolveChars(chars) {
    switch (chars) {
        case 'default':
            return alphaNumeric;
        case 'a-z':
        case 'alpha':
            return alphaLower;
        case 'A-Z':
        case 'ALPHA':
            return alphaUpper;
        case '0-9':
        case 'numeric':
            return numeric;
        case 'base32':
            return alphaUpper + '234567';
        default:
            return chars;
    }
}

function buildGenerator(options) {
    const config = Object.assign({ chars: 'default' }, options);
    const pool = resolveChars(config.chars);
    assert(typeof pool === 'string' && pool.length > 0, 'Invalid character set');

    const source = typeof config.source === 'function'
        ? config.source
        : (size) => {
              const buffer = new Uint8Array(size);
              for (let i = 0; i < size; i += 1) {
                  buffer[i] = Math.floor(Math.random() * 256);
              }
              return buffer;
          };

    return {
        generate(size, overrideChars) {
            const chars = overrideChars ? resolveChars(overrideChars) : pool;
            assert(typeof chars === 'string' && chars.length > 0, 'Invalid override character set');
            const max = Math.floor(256 / chars.length) * chars.length;
            let ret = '';
            while (ret.length < size) {
                const buf = source(size - ret.length);
                for (let i = 0; i < buf.length; i += 1) {
                    const x = buf[i];
                    if (x < max) {
                        ret += chars[x % chars.length];
                    }
                }
            }
            return ret;
        },
    };
}

function base62(n) {
    assert(n >= 0, 'n must be >= 0');
    n = Math.floor(n);
    const ret = [];
    do {
        const index = n % 62;
        ret.push(alphaNumeric[index]);
        n = Math.floor(n / 62);
    } while (n > 0);
    return ret.reverse().join('');
}

const defaultEpoch = 946684800000;
const defaultPrefixLength = 8;
function suidPrefix(epoch, prefixLength) {
    let ret = base62(Date.now() - epoch);
    while (ret.length < prefixLength) {
        ret = `0${ret}`;
    }
    return ret;
}

const defaultGenerator = buildGenerator();

module.exports = {
    generator: buildGenerator,
    generate: defaultGenerator.generate,
    uid: defaultGenerator.generate,
    suid(length, epoch = defaultEpoch, prefixLength = defaultPrefixLength) {
        return suidPrefix(epoch, prefixLength) + defaultGenerator.generate(length);
    },
};
