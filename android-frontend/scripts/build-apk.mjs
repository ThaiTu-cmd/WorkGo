// Builds a signed release APK: npm run build:apk
// Prints which backend the APK will call before spending ~10 minutes on Gradle.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import envPkg from '@expo/env';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';
const SIGNING_KEYS = ['WORKGO_UPLOAD_STORE_FILE', 'WORKGO_UPLOAD_STORE_PASSWORD', 'WORKGO_UPLOAD_KEY_ALIAS', 'WORKGO_UPLOAD_KEY_PASSWORD'];

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

// 1. Same env files Expo reads for a production bundle (.env, .env.production, .env.local …).
envPkg.loadProjectEnv(root, { mode: 'production', silent: true });
const apiUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim() || 'http://10.0.2.2:8888/api/v1 (mặc định: emulator)';
const allowHttp = process.env.WORKGO_ALLOW_HTTP === '1';

console.log(`API URL:        ${apiUrl}`);
console.log(`HTTP cleartext: ${allowHttp ? 'bật' : 'tắt'}`);
if (apiUrl.startsWith('http://') && !allowHttp) {
  console.warn('⚠ URL dùng http:// nhưng WORKGO_ALLOW_HTTP chưa bật: APK release sẽ không gọi được backend.');
}

// 2. Release signing properties (see README "Tạo keystore").
const gradleHome = process.env.GRADLE_USER_HOME || join(homedir(), '.gradle');
const propsFile = join(gradleHome, 'gradle.properties');
const props = existsSync(propsFile) ? readFileSync(propsFile, 'utf8') : '';
const missing = SIGNING_KEYS.filter((k) => !new RegExp(`^\\s*${k}\\s*=`, 'm').test(props));
if (missing.length) {
  fail(`Thiếu ${missing.join(', ')} trong ${propsFile}.\n  Tạo keystore và thêm 4 dòng WORKGO_UPLOAD_* theo hướng dẫn trong android-frontend/README.md.`);
}

// 3. Gradle needs the Android SDK location.
if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
  const guess = isWindows ? join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk') : join(homedir(), 'Android', 'Sdk');
  if (!existsSync(guess)) fail('Không tìm thấy Android SDK. Đặt biến ANDROID_HOME trỏ tới thư mục SDK.');
  process.env.ANDROID_HOME = guess;
}

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: process.env, shell: isWindows });
  if (r.status !== 0) fail(`Lệnh thất bại: ${cmd} ${args.join(' ')}`);
}

// 4. Generate android/ and build.
run('npx', ['expo', 'prebuild', '--platform', 'android', '--clean', '--no-install'], root);
run(isWindows ? 'gradlew.bat' : './gradlew', ['assembleRelease', '--console=plain'], join(root, 'android'));

const apk = join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
if (!existsSync(apk)) fail(`Build xong nhưng không thấy ${apk}`);
console.log(`\n✔ APK: ${apk}\n  API URL: ${apiUrl} · HTTP cleartext: ${allowHttp ? 'bật' : 'tắt'}`);
