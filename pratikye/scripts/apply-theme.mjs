#!/usr/bin/env node
// pratikye temasını bir Ghost örneğine yükler ve etkinleştirir (Admin API).
//
// Kullanım:
//   GHOST_URL=https://cms.pratikye.com GHOST_ADMIN_API_KEY=id:secret node pratikye/scripts/apply-theme.mjs
//   ... --dry-run           yalnızca zip'i hazırlar, istek göndermez
//   ... --activate-only     zip üretmeden mevcut yükleme varsa etkinleştirir
//
// Güvenlik: Yalnızca tema yükleme/etkinleştirme yapar; içerik değiştirmez.
// Geri alma: Ghost panelinde Ayarlar → Tasarım bölümünden önceki temayı etkinleştirin
// ya da: PUT /ghost/api/admin/themes/<eski-tema>/activate/
import { execFileSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const url = (process.env.GHOST_URL || '').replace(/\/+$/, '');
const adminKey = process.env.GHOST_ADMIN_API_KEY || '';
const apiVersion = process.env.GHOST_API_VERSION || 'v6.0';

function bail(message) {
    console.error(message);
    process.exit(1);
}

function token() {
    const [id, secret] = adminKey.split(':');
    if (!id || !secret) bail('GHOST_ADMIN_API_KEY "id:secret" biçiminde olmalı.');
    const b64 = (v) => Buffer.from(v).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    const now = Math.floor(Date.now() / 1000);
    const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id }));
    const payload = b64(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' }));
    const signature = b64(createHmac('sha256', Buffer.from(secret, 'hex')).update(`${header}.${payload}`).digest());
    return `${header}.${payload}.${signature}`;
}

async function request(path, { method = 'GET', body, form } = {}) {
    const response = await fetch(`${url}/ghost/api/admin/${path}`, {
        method,
        headers: {
            Authorization: `Ghost ${token()}`,
            'Accept-Version': apiVersion,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        ...(form ? { body: form } : {}),
    });
    const text = await response.text();
    let json = null;
    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        json = null;
    }
    return { status: response.status, json, text };
}

function buildZip() {
    const out = execFileSync('node', [resolve(root, 'pratikye/scripts/build-theme-zip.mjs')], { encoding: 'utf8' }).trim();
    return out.split('\n').pop().trim();
}

async function main() {
    if (!dryRun && (!url || !adminKey)) bail('GHOST_URL ve GHOST_ADMIN_API_KEY gerekli (veya --dry-run).');

    const themePkg = JSON.parse(readFileSync(resolve(root, 'pratikye/theme/package.json'), 'utf8'));
    console.log(`tema: ${themePkg.name} v${themePkg.version}`);

    // Eski zip'leri yanlışlıkla canlıya yüklememek için her çalışmada yeniden paketle.
    const zipPath = buildZip();
    console.log(`zip: ${zipPath}`);

    if (dryRun) {
        console.log('--dry-run: istek gönderilmedi.');
        return;
    }

    const form = new FormData();
    const fileBuffer = readFileSync(zipPath);
    form.append('file', new Blob([fileBuffer], { type: 'application/zip' }), 'pratikye-theme.zip');
    form.append('ref', 'pratikye-theme.zip');

    const upload = await request('themes/upload/', { method: 'POST', form });
    if (upload.status !== 200 && upload.status !== 201) {
        bail(`yükleme başarısız (${upload.status}): ${upload.text.slice(0, 400)}`);
    }
    console.log('yükleme: ok');

    // Ghost, yüklenen klasör adını (pratikye-theme) API kimliği olarak kullanır;
    // package.json içindeki kısa package name (pratikye) aynı şey değildir.
    const activate = await request(`themes/pratikye-theme/activate/`, { method: 'PUT' });
    if (activate.status !== 200) {
        bail(`etkinleştirme başarısız (${activate.status}): ${activate.text.slice(0, 400)}`);
    }
    console.log('etkinleştirme: ok');

    const current = await request('themes/');
    const active = current.json?.themes?.find((theme) => theme.active);
    console.log(`aktif tema: ${active ? active.name : 'bilinmiyor'}`);
}

main().catch((error) => bail('hata: ' + error.message));
