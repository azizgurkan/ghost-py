#!/usr/bin/env node
// pratikye temasını Ghost yüklemesi için zip olarak paketler.
// Kullanım: node pratikye/scripts/build-theme-zip.mjs
// Çıktı: pratikye/dist/pratikye-theme-<sürüm>.zip
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const themeDir = resolve(root, 'pratikye/theme');
const distDir = resolve(root, 'pratikye/dist');

const pkg = JSON.parse(readFileSync(resolve(themeDir, 'package.json'), 'utf8'));
const out = resolve(distDir, `pratikye-theme-${pkg.version}.zip`);

mkdirSync(distDir, { recursive: true });
const stage = resolve(distDir, `.stage-${process.pid}`);
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
cpSync(themeDir, resolve(stage, 'pratikye'), { recursive: true });
rmSync(out, { force: true });

// Ghost, tema klasörünün zip kökünde tek bir klasör olmasını bekler.
execFileSync('zip', ['-rq', out, 'pratikye'], { cwd: stage });
rmSync(stage, { recursive: true, force: true });

if (!existsSync(out)) {
    console.error('zip üretilemedi');
    process.exit(1);
}
console.log(out);
