import { parseSyntheticRunConfig } from './synthetic-data.config';
import type { FileMetadata } from './synthetic-data.types';

const freshBackup = (): FileMetadata => ({
    isFile: true,
    size: 1024,
    ageMs: 60_000,
});

const validWriteArgs = [
    'apply',
    '--confirm',
    'RESET_PRELIVE_DATA',
    '--backup-file',
    '/safe/backup.dump',
    '--protect',
    'admin@example.invalid',
    '--protect',
    'ci@example.invalid',
];

const validWriteEnv: NodeJS.ProcessEnv = {
    SYNTHETIC_DATA_ALLOWED: 'true',
    APP_LIFECYCLE: 'prelive',
};

describe('parseSyntheticRunConfig', () => {
    it('defaults to read-only plan', () => {
        expect(parseSyntheticRunConfig([], {}, () => null)).toEqual({
            mode: 'plan',
            protectedEmails: [],
            reportJson: false,
        });
    });

    it.each(['apply', 'cleanup'] as const)(
        'rejects %s without every write gate',
        (mode) => {
            expect(() =>
                parseSyntheticRunConfig([mode], {}, () => null),
            ).toThrow('Synthetic write blocked');
        },
    );

    it('accepts apply with pre-live flags, protected accounts and fresh backup', () => {
        const config = parseSyntheticRunConfig(
            validWriteArgs,
            validWriteEnv,
            freshBackup,
        );

        expect(config).toEqual({
            mode: 'apply',
            protectedEmails: [
                'admin@example.invalid',
                'ci@example.invalid',
            ],
            backupFile: '/safe/backup.dump',
            reportJson: false,
        });
    });

    it('normalizes protected emails and rejects duplicates', () => {
        const args = [
            ...validWriteArgs.slice(0, -2),
            '--protect',
            'ADMIN@EXAMPLE.INVALID',
            '--protect',
            'admin@example.invalid',
        ];

        expect(() =>
            parseSyntheticRunConfig(args, validWriteEnv, freshBackup),
        ).toThrow('Protected accounts must be unique');
    });

    it.each([
        [{ isFile: false, size: 1024, ageMs: 1_000 }, 'regular file'],
        [{ isFile: true, size: 0, ageMs: 1_000 }, 'non-empty'],
        [{ isFile: true, size: 1024, ageMs: 30 * 60_000 + 1 }, '30 minutes'],
    ] as const)(
        'rejects an invalid backup: %s',
        (metadata, expectedMessage) => {
            expect(() =>
                parseSyntheticRunConfig(
                    validWriteArgs,
                    validWriteEnv,
                    () => metadata,
                ),
            ).toThrow(expectedMessage);
        },
    );

    it('does not expose password environment variables', () => {
        const config = parseSyntheticRunConfig(
            [...validWriteArgs, '--json'],
            {
                ...validWriteEnv,
                SYNTHETIC_CLIENT_PASSWORD: 'never-return-this',
            },
            freshBackup,
        );

        expect(config.reportJson).toBe(true);
        expect(JSON.stringify(config)).not.toContain('never-return-this');
    });

    it('rejects unknown modes and arguments', () => {
        expect(() =>
            parseSyntheticRunConfig(['destroy'], {}, () => null),
        ).toThrow('Unknown mode');
        expect(() =>
            parseSyntheticRunConfig(['plan', '--unsafe'], {}, () => null),
        ).toThrow('Unknown argument');
    });
});
