#!/usr/bin/env node
// pratikye marka ayarlarını bir Ghost örneğine uygular:
//   - site ikonu (favicon / pano simgesi) yükleme
//   - başlık, açıklama, vurgu rengi, dil ve saat dilimi ayarları
//
// Kullanım:
//   GHOST_URL=https://cms.pratikye.com GHOST_ADMIN_API_KEY=id:secret node pratikye/scripts/apply-branding.mjs
//   ... --no-icon     ikon yüklemeyi atla
//   ... --dry-run     yalnızca planı yazdır, istek gönderme
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const iconPath = resolve(root, 'pratikye/theme/assets/images/pratikye-mark.svg');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const skipIcon = args.includes('--no-icon');
const url = (process.env.GHOST_URL || '').replace(/\/+$/, '');
const adminKey = process.env.GHOST_ADMIN_API_KEY || '';
const apiVersion = process.env.GHOST_API_VERSION || 'v6.0';

const SETTINGS = [
    ['title', 'pratikye'],
    ['description', 'Akıllı cihazlarla pratik yemek.'],
    ['accent_color', '#cf3d35'],
    ['locale', 'tr'],
    ['timezone', 'Europe/Istanbul'],
];

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

async function main() {
    if (!dryRun && (!url || !adminKey)) bail('GHOST_URL ve GHOST_ADMIN_API_KEY gerekli (veya --dry-run).');

    console.log('uygulanacak ayarlar:');
    for (const [key, value] of SETTINGS) console.log(`  ${key} = ${value}`);
    console.log(`  icon = ${skipIcon ? '(atlandı)' : iconPath}`);

    if (dryRun) {
        console.log('--dry-run: istek gönderilmedi.');
        return;
    }

    const settings = SETTINGS.map(([key, value]) => ({ key, value }));

    if (!skipIcon) {
        const svg = readFileSync(iconPath);
        const form = new FormData();
        form.append('file', new Blob([svg], { type: 'image/svg+xml' }), 'pratikye-mark.svg');
        form.append('ref', 'pratikye-mark.svg');
        form.append('purpose', 'icon');
        const upload = await request('images/upload/', { method: 'POST', form });
        const uploaded = upload.json?.images?.[0]?.url;
        if (upload.status === 201 && uploaded) {
            console.log(`ikon yüklendi: ${uploaded}`);
            settings.push({ key: 'icon', value: uploaded });
        } else {
            console.warn(`ikon yüklenemedi (${upload.status}): ${upload.text.slice(0, 200)}`);
        }
    }

    const update = await request('settings/', { method: 'PUT', body: { settings } });
    if (update.status !== 200) {
        bail(`ayarlar güncellenemedi (${update.status}): ${update.text.slice(0, 400)}`);
    }
    console.log('ayarlar güncellendi.');

    const check = await request('settings/');
    const wanted = ['title', 'description', 'accent_color', 'locale', 'timezone', 'icon'];
    const found = (check.json?.settings || []).filter((setting) => wanted.includes(setting.key));
    for (const setting of found) console.log(`  ${setting.key} = ${String(setting.value).slice(0, 80)}`);
}

main().catch((error) => bail('hata: ' + error.message));
