import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Materialize only safe, intra-bundle links as independent files/directories.
 * The receiving FreeBSD stage deliberately rejects *all* tar links before
 * extraction. No files outside bundleRoot are read, and no link names/targets
 * are printed (they can contain user-controlled information).
 */
export function flattenInternalBundleLinks(bundleRoot) {
    if (typeof bundleRoot !== 'string' || !path.isAbsolute(bundleRoot)) {
        throw new Error('invalid-bundle-root');
    }
    const rootInfo = fs.lstatSync(bundleRoot);
    if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) {
        throw new Error('unsafe-bundle-root');
    }
    const root = fs.realpathSync(bundleRoot);
    const within = (p) => p === root || p.startsWith(root + path.sep);
    const MAX_ENTRIES = 100000;
    const MAX_DEPTH = 48;
    const MAX_EXPANDED_BYTES = 1024 * 1024 * 1024;
    let walked = 0;
    let expandedBytes = 0;
    let fileLinks = 0;
    let directoryLinks = 0;
    let hardlinkCopies = 0;

    function checkLimit(depth) {
        if (++walked > MAX_ENTRIES || depth > MAX_DEPTH) {
            throw new Error('bundle-expansion-limit');
        }
    }
    function realInside(source) {
        const resolved = fs.realpathSync(source);
        if (!within(resolved)) throw new Error('external-link-rejected');
        return resolved;
    }
    function accountFile(file) {
        const stat = fs.statSync(file);
        expandedBytes += stat.size;
        if (expandedBytes > MAX_EXPANDED_BYTES) {
            throw new Error('bundle-expansion-size-limit');
        }
    }
    function traverseUnlinked(dir, depth, visit) {
        checkLimit(depth);
        for (const name of fs.readdirSync(dir)) {
            const entry = path.join(dir, name);
            const st = fs.lstatSync(entry);
            if (st.isSymbolicLink()) {
                visit(entry, 'link', st);
            } else if (st.isDirectory()) {
                traverseUnlinked(entry, depth + 1, visit);
            } else if (st.isFile()) {
                visit(entry, 'file', st);
            } else {
                throw new Error('unsupported-bundle-entry');
            }
        }
    }

    // Fail before modifying anything if the source includes outside, dangling,
    // cyclic, or special symlinks. Do not recurse into links during discovery.
    const links = [];
    traverseUnlinked(root, 0, (entry, kind) => {
        if (kind !== 'link') return;
        const target = realInside(entry);
        const stat = fs.statSync(target);
        if (!stat.isDirectory() && !stat.isFile()) {
            throw new Error('unsupported-link-target');
        }
        links.push(entry);
    });

    function copyResolved(source, destination, ancestorDirs = new Set(), depth = 0) {
        checkLimit(depth);
        const real = realInside(source);
        const info = fs.statSync(real);
        if (info.isFile()) {
            accountFile(real);
            fs.copyFileSync(real, destination, fs.constants.COPYFILE_EXCL);
            fs.chmodSync(destination, info.mode & 0o777);
            return;
        }
        if (!info.isDirectory()) throw new Error('unsupported-link-target');
        if (ancestorDirs.has(real)) throw new Error('cyclic-directory-link');
        const nextAncestors = new Set(ancestorDirs);
        nextAncestors.add(real);
        fs.mkdirSync(destination, { mode: info.mode & 0o777 });
        for (const name of fs.readdirSync(real)) {
            copyResolved(
                path.join(real, name),
                path.join(destination, name),
                nextAncestors,
                depth + 1,
            );
        }
    }

    for (const link of links) {
        const target = realInside(link);
        const info = fs.statSync(target);
        // A directory link into one of its own ancestors cannot be copied
        // without recursion. Preserve the fail-closed behavior.
        if (
            info.isDirectory() &&
            (link === target || link.startsWith(target + path.sep))
        ) {
            throw new Error('cyclic-directory-link');
        }
        const scratch = fs.mkdtempSync(
            path.join(path.dirname(link), '.salonbw-materialize-'),
        );
        try {
            const replacement = path.join(scratch, 'replacement');
            copyResolved(target, replacement);
            fs.unlinkSync(link);
            fs.renameSync(replacement, link);
            if (info.isDirectory()) directoryLinks++;
            else fileLinks++;
        } finally {
            fs.rmSync(scratch, { recursive: true, force: true });
        }
    }

    // TAR can encode duplicate inodes as hardlink records even when no
    // symbolic links remain. Break all hardlinks inside the private bundle.
    traverseUnlinked(root, 0, (entry, kind, st) => {
        if (kind === 'link') throw new Error('link-left-after-materialize');
        if (kind !== 'file' || st.nlink <= 1) return;
        accountFile(entry);
        const scratch = fs.mkdtempSync(
            path.join(path.dirname(entry), '.salonbw-unlink-'),
        );
        try {
            const dest = path.join(scratch, 'copy');
            fs.copyFileSync(entry, dest, fs.constants.COPYFILE_EXCL);
            fs.chmodSync(dest, st.mode & 0o777);
            fs.renameSync(dest, entry);
            hardlinkCopies++;
        } finally {
            fs.rmSync(scratch, { recursive: true, force: true });
        }
    });
    // Re-verify after normalization; never assume cleanup succeeded.
    traverseUnlinked(root, 0, (entry, kind, st) => {
        if (kind === 'link' || (kind === 'file' && st.nlink > 1)) {
            throw new Error('archive-link-normalization-incomplete');
        }
    });
    return { fileLinks, directoryLinks, hardlinkCopies };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    try {
        if (process.argv.length !== 3) throw new Error('missing-arguments');
        const result = flattenInternalBundleLinks(process.argv[2]);
        // Show counts only, never filenames, target strings or contents.
        console.log('BUNDLE_LINK_NORMALIZATION=PASS');
        console.log('BUNDLE_INTERNAL_FILE_LINKS=' + result.fileLinks);
        console.log('BUNDLE_INTERNAL_DIRECTORY_LINKS=' + result.directoryLinks);
        console.log('BUNDLE_HARDLINK_COPIES=' + result.hardlinkCopies);
    } catch (error) {
        // Classification is safe; never reveal filenames, link destinations,
        // private source strings, OS exception paths or file contents.
        const approvedReasons = new Set([
            'invalid-bundle-root', 'unsafe-bundle-root', 'bundle-expansion-limit',
            'bundle-expansion-size-limit', 'external-link-rejected',
            'unsupported-bundle-entry', 'unsupported-link-target',
            'cyclic-directory-link', 'link-left-after-materialize',
            'archive-link-normalization-incomplete',
        ]);
        const reason = approvedReasons.has(error?.message)
            ? error.message : 'unsafe-or-unresolvable-link';
        console.error('BUNDLE_LINK_NORMALIZATION=BLOCKED reason=' + reason);
        process.exitCode = 1;
    }
}
