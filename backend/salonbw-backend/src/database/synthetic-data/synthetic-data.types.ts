export type SyntheticMode = 'plan' | 'apply' | 'verify' | 'cleanup';

export interface FileMetadata {
    isFile: boolean;
    size: number;
    ageMs: number;
}

export interface SyntheticRunConfig {
    mode: SyntheticMode;
    protectedEmails: string[];
    backupFile?: string;
    reportJson: boolean;
}
