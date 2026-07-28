import type {
    FileMetadata,
    SyntheticMode,
    SyntheticRunConfig,
} from './synthetic-data.types';

const MODES = new Set<SyntheticMode>(['plan', 'apply', 'verify', 'cleanup']);
const WRITE_MODES = new Set<SyntheticMode>(['apply', 'cleanup']);
const MAX_BACKUP_AGE_MS = 30 * 60_000;

function takeValue(argv: string[], index: number, flag: string): string {
    const value = argv[index + 1]?.trim();
    if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for ${flag}`);
    }
    return value;
}

export function parseSyntheticRunConfig(
    argv: string[],
    env: NodeJS.ProcessEnv,
    getFileMetadata: (path: string) => FileMetadata | null,
): SyntheticRunConfig {
    let mode: SyntheticMode = 'plan';
    let offset = 0;

    if (argv[0] && !argv[0].startsWith('--')) {
        if (!MODES.has(argv[0] as SyntheticMode)) {
            throw new Error(`Unknown mode: ${argv[0]}`);
        }
        mode = argv[0] as SyntheticMode;
        offset = 1;
    }

    let confirmation: string | undefined;
    let backupFile: string | undefined;
    let reportJson = false;
    const protectedEmails = (env.SYNTHETIC_PROTECTED_EMAILS ?? '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);

    for (let index = offset; index < argv.length; index += 1) {
        const argument = argv[index];
        switch (argument) {
            case '--confirm':
                confirmation = takeValue(argv, index, argument);
                index += 1;
                break;
            case '--backup-file':
                backupFile = takeValue(argv, index, argument);
                index += 1;
                break;
            case '--protect':
                protectedEmails.push(
                    takeValue(argv, index, argument).toLowerCase(),
                );
                index += 1;
                break;
            case '--json':
                reportJson = true;
                break;
            default:
                throw new Error(`Unknown argument: ${argument}`);
        }
    }

    if (new Set(protectedEmails).size !== protectedEmails.length) {
        throw new Error('Protected accounts must be unique');
    }

    if (WRITE_MODES.has(mode)) {
        const blockers: string[] = [];

        if (env.SYNTHETIC_DATA_ALLOWED !== 'true') {
            blockers.push('SYNTHETIC_DATA_ALLOWED must equal true');
        }
        if (env.APP_LIFECYCLE !== 'prelive') {
            blockers.push('APP_LIFECYCLE must equal prelive');
        }
        if (confirmation !== 'RESET_PRELIVE_DATA') {
            blockers.push('confirmation phrase does not match');
        }
        if (protectedEmails.length < 2) {
            blockers.push('at least two protected accounts are required');
        }

        const metadata = backupFile ? getFileMetadata(backupFile) : null;
        if (!backupFile || !metadata) {
            blockers.push('backup file is required');
        } else {
            if (!metadata.isFile) {
                blockers.push('backup must be a regular file');
            }
            if (metadata.size <= 0) {
                blockers.push('backup must be non-empty');
            }
            if (metadata.ageMs < 0 || metadata.ageMs > MAX_BACKUP_AGE_MS) {
                blockers.push('backup must be no older than 30 minutes');
            }
        }

        if (blockers.length > 0) {
            throw new Error(`Synthetic write blocked: ${blockers.join('; ')}`);
        }
    }

    return {
        mode,
        protectedEmails,
        ...(backupFile ? { backupFile } : {}),
        reportJson,
    };
}
