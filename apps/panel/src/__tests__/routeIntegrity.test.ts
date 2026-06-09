import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';

const appRoot = path.resolve(__dirname, '../..');
const pagesRoot = path.join(appRoot, 'src/pages');
const nextConfig = readFileSync(path.join(appRoot, 'next.config.mjs'), 'utf8');
const configuredSources = new Set(
    [...nextConfig.matchAll(/source:\s*'([^']+)'/g)].map((match) => match[1]),
);

function walkFiles(dir: string, files: string[] = []): string[] {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkFiles(fullPath, files);
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
            files.push(fullPath);
        }
    }
    return files;
}

function pageRouteExists(route: string): boolean {
    const cleanRoute = route.split('?')[0].replace(/\/$/, '') || '/';
    if (configuredSources.has(cleanRoute)) {
        return true;
    }
    if (
        cleanRoute === '/' ||
        cleanRoute.startsWith('/api/') ||
        cleanRoute.includes(':')
    ) {
        return true;
    }

    const segments = cleanRoute.split('/').filter(Boolean);
    const candidates = [
        path.join(pagesRoot, ...segments) + '.tsx',
        path.join(pagesRoot, ...segments) + '.ts',
        path.join(pagesRoot, ...segments, 'index.tsx'),
        path.join(pagesRoot, ...segments, 'index.ts'),
    ];
    if (candidates.some(existsSync)) {
        return true;
    }

    let currentDir = pagesRoot;
    for (const [index, segment] of segments.entries()) {
        if (!existsSync(currentDir)) {
            return false;
        }
        const exactDir = path.join(currentDir, segment);
        if (existsSync(exactDir)) {
            currentDir = exactDir;
            continue;
        }
        const isLastSegment = index === segments.length - 1;
        if (
            isLastSegment &&
            readdirSync(currentDir, { withFileTypes: true }).some(
                (entry) =>
                    entry.isFile() &&
                    entry.name.startsWith('[') &&
                    (entry.name.endsWith('].tsx') ||
                        entry.name.endsWith('].ts')),
            )
        ) {
            return true;
        }
        const dynamicDir = readdirSync(currentDir, {
            withFileTypes: true,
        }).find(
            (entry) =>
                entry.isDirectory() &&
                entry.name.startsWith('[') &&
                entry.name.endsWith(']'),
        );
        if (!dynamicDir) {
            return false;
        }
        currentDir = path.join(currentDir, dynamicDir.name);
    }

    return (
        existsSync(`${currentDir}.tsx`) ||
        existsSync(`${currentDir}.ts`) ||
        existsSync(path.join(currentDir, 'index.tsx')) ||
        existsSync(path.join(currentDir, 'index.ts'))
    );
}

describe('panel route integrity', () => {
    it('does not rewrite legacy paths to missing static pages', () => {
        const destinations = [
            ...nextConfig.matchAll(/destination:\s*'([^']+)'/g),
        ].map((match) => match[1]);

        const missing = destinations
            .filter((destination) => destination.startsWith('/'))
            .filter((destination) => !destination.startsWith('/api/'))
            .filter((destination) => !destination.includes(':'))
            .filter((destination) => !pageRouteExists(destination));

        expect(missing).toEqual([]);
    });

    it('does not render static internal links to missing pages', () => {
        const internalLinks = walkFiles(path.join(appRoot, 'src')).flatMap(
            (file) => {
                const source = readFileSync(file, 'utf8');
                const matches = [
                    ...source.matchAll(
                        /href=\{?['"](\/[A-Za-z0-9_./?=&%-]+)['"]/g,
                    ),
                    ...source.matchAll(
                        /href:\s*['"](\/[A-Za-z0-9_./?=&%-]+)['"]/g,
                    ),
                ];
                return matches.map((match) => ({
                    route: match[1],
                    file: path.relative(appRoot, file),
                }));
            },
        );

        const missing = internalLinks
            .filter(({ route }) => !route.startsWith('/api/'))
            .filter(({ route }) => !route.includes('['))
            .filter(({ route }) => !route.includes('#'))
            .filter(({ route }) => !route.match(/\.(json|svg|ico|png|jpg)$/))
            .filter(({ route }) => !pageRouteExists(route));

        expect(missing).toEqual([]);
    });
});
