import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ANDROID_GRADLE = 'android/app/build.gradle';
const IOS_PBXPROJ = 'ios/App/App.xcodeproj/project.pbxproj';

// Android requires a strictly increasing integer. Packing the semver segments
// as MAJOR * 10000 + MINOR * 100 + PATCH keeps that ordering readable, and
// clamping each sub-segment to 99 stops a large patch from stealing a minor
// bump's range.
export function versionCodeFromName(name) {
    const segments = String(name).split('.');
    const major = Number.parseInt(segments[0], 10);
    if (!Number.isFinite(major)) return 1;
    const clamp = value => {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) ? Math.min(99, Math.max(0, parsed)) : 0;
    };
    // The checked-in Android versionCode is 1, so any parseable version must
    // produce a code strictly greater than that floor to register as an
    // upgrade (see the "clears the checked-in versionCode of 1" test).
    return Math.max(2, major * 10000 + clamp(segments[1]) * 100 + clamp(segments[2]));
}

async function rewrite(path, replacements) {
    let source;
    try {
        source = await readFile(path, 'utf8');
    } catch {
        return false;
    }
    const updated = replacements.reduce((text, [pattern, value]) => text.replace(pattern, value), source);
    if (updated === source) return false;
    await writeFile(path, updated);
    return true;
}

export async function syncNativeVersion(rootDir = process.cwd()) {
    const manifest = JSON.parse(await readFile(join(rootDir, 'package.json'), 'utf8'));
    const versionName = manifest.version;
    const versionCode = versionCodeFromName(versionName);
    const files = [];

    if (await rewrite(join(rootDir, ANDROID_GRADLE), [
        [/versionCode\s+\d+/, `versionCode ${versionCode}`],
        [/versionName\s+"[^"]*"/, `versionName "${versionName}"`],
    ])) files.push(ANDROID_GRADLE);

    if (await rewrite(join(rootDir, IOS_PBXPROJ), [
        [/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${versionCode};`],
        [/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${versionName};`],
    ])) files.push(IOS_PBXPROJ);

    return { versionName, versionCode, files };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const result = await syncNativeVersion();
    console.log(`Synced ${result.versionName} (code ${result.versionCode}) → ${result.files.join(', ') || 'no changes'}`);
}
