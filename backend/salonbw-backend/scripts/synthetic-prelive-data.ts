import 'reflect-metadata';
import { randomBytes } from 'node:crypto';
import { statSync } from 'node:fs';
import * as bcrypt from 'bcrypt';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { parseSyntheticRunConfig } from '../src/database/synthetic-data/synthetic-data.config';
import { generateSyntheticDataset } from '../src/database/synthetic-data/synthetic-data.dataset';
import {
    runSyntheticDataCommand,
    type SyntheticCommandReport,
} from '../src/database/synthetic-data/synthetic-data.service';
import {
    assertProtectedAccounts,
    assertResetSchema,
    buildSyntheticPlan,
    cleanupSyntheticData,
    insertSyntheticDataset,
    resetOperationalData,
    verifySyntheticState,
} from '../src/database/synthetic-data/synthetic-data.store';
import type {
    FileMetadata,
    SyntheticRunConfig,
} from '../src/database/synthetic-data/synthetic-data.types';

loadEnv({ quiet: true });

const HELP = `Synthetic pre-live dataset

Usage:
  synthetic-prelive-data.ts [plan|verify|apply|cleanup] [options]

Options:
  --protect <email>       Account to preserve; repeat for owner and CI account
  --backup-file <path>    Fresh pg_dump required for apply and cleanup
  --confirm RESET_PRELIVE_DATA
  --json
  --help

Write guards:
  SYNTHETIC_DATA_ALLOWED=true
  APP_LIFECYCLE=prelive`;

export interface SyntheticDataCliDependencies {
    createDataSource(env: NodeJS.ProcessEnv): DataSource;
    getFileMetadata(path: string): FileMetadata | null;
    runCommand(
        dataSource: DataSource,
        config: SyntheticRunConfig,
    ): Promise<SyntheticCommandReport>;
    writeOutput(value: string): void;
    writeError(value: string): void;
}

function createDataSource(env: NodeJS.ProcessEnv): DataSource {
    const url = env.DATABASE_URL;
    const host = env.DB_HOST || env.PGHOST;
    const username = env.DB_USER || env.PGUSER;
    const password = env.DB_PASS || env.PGPASSWORD;
    const database = env.DB_NAME || env.PGDATABASE;

    if (!url && (!host || !username || !database)) {
        throw new Error(
            'Missing database configuration. Set DATABASE_URL or DB_HOST/DB_USER/DB_NAME.',
        );
    }

    return new DataSource({
        type: 'postgres',
        ...(url
            ? { url }
            : {
                  host,
                  port: Number(env.DB_PORT || env.PGPORT || '5432'),
                  username,
                  password,
                  database,
              }),
        ssl: env.PGSSL === '1' ? true : undefined,
    });
}

function getFileMetadata(path: string): FileMetadata | null {
    try {
        const stat = statSync(path);
        return {
            isFile: stat.isFile(),
            size: stat.size,
            ageMs: Date.now() - stat.mtimeMs,
        };
    } catch {
        return null;
    }
}

async function runCommand(
    dataSource: DataSource,
    config: SyntheticRunConfig,
): Promise<SyntheticCommandReport> {
    return runSyntheticDataCommand(
        {
            dataSource,
            anchorDate: new Date(),
            createPasswordHash: async () =>
                bcrypt.hash(randomBytes(32).toString('hex'), 12),
            generateDataset: generateSyntheticDataset,
            buildSyntheticPlan,
            assertProtectedAccounts,
            assertResetSchema,
            resetOperationalData,
            insertSyntheticDataset,
            verifySyntheticState,
            cleanupSyntheticData,
        },
        config,
    );
}

function redact(value: string): string {
    return value
        .replace(
            /\b(postgres(?:ql)?:\/\/)[^@\s]+@/gi,
            '$1[REDACTED]@',
        )
        .replace(
            /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
            '[EMAIL]',
        );
}

function publicReport(report: SyntheticCommandReport): object {
    return {
        mode: report.mode,
        plan: {
            protectedAdminPresent: report.plan.protectedAdminPresent,
            protectedCiClientPresent: report.plan.protectedCiClientPresent,
            deleteCounts: report.plan.deleteCounts,
            createCounts: report.plan.createCounts,
            blockers: report.plan.blockers,
        },
        ...(report.mutationCounts
            ? { mutationCounts: report.mutationCounts }
            : {}),
        ...(report.insertCounts ? { insertCounts: report.insertCounts } : {}),
        ...(report.verification
            ? { verification: report.verification }
            : {}),
    };
}

export async function main(
    argv: string[],
    env: NodeJS.ProcessEnv,
    dependencies: SyntheticDataCliDependencies,
): Promise<number> {
    const normalizedArgv = argv.filter((argument) => argument !== '--');
    if (normalizedArgv.includes('--help')) {
        dependencies.writeOutput(HELP);
        return 0;
    }

    let dataSource: DataSource | undefined;
    let initialized = false;
    try {
        const config = parseSyntheticRunConfig(
            normalizedArgv,
            env,
            dependencies.getFileMetadata,
        );
        dataSource = dependencies.createDataSource(env);
        await dataSource.initialize();
        initialized = true;
        const report = await dependencies.runCommand(dataSource, config);
        dependencies.writeOutput(
            JSON.stringify(publicReport(report), null, 2),
        );
        return 0;
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Unknown command failure';
        dependencies.writeError(redact(message));
        return 1;
    } finally {
        if (initialized && dataSource) {
            await dataSource.destroy().catch(() => undefined);
        }
    }
}

const defaultDependencies: SyntheticDataCliDependencies = {
    createDataSource,
    getFileMetadata,
    runCommand,
    writeOutput: (value) => process.stdout.write(`${value}\n`),
    writeError: (value) => process.stderr.write(`${value}\n`),
};

if (require.main === module) {
    void main(process.argv.slice(2), process.env, defaultDependencies).then(
        (exitCode) => {
            process.exitCode = exitCode;
        },
    );
}
