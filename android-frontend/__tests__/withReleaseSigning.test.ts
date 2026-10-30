import { readFileSync } from 'fs';
import { join } from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { addReleaseSigning } = require('../plugins/withReleaseSigning');

const gradle = readFileSync(join(__dirname, 'fixtures', 'app-build.gradle'), 'utf8');

test('adds a release signing config read from WORKGO_UPLOAD_* gradle properties', () => {
  const out: string = addReleaseSigning(gradle);
  const signing = out.slice(out.indexOf('signingConfigs {'), out.indexOf('buildTypes {'));
  expect(signing).toContain('release {');
  for (const prop of ['WORKGO_UPLOAD_STORE_FILE', 'WORKGO_UPLOAD_STORE_PASSWORD', 'WORKGO_UPLOAD_KEY_ALIAS', 'WORKGO_UPLOAD_KEY_PASSWORD']) {
    expect(signing).toContain(prop);
  }
});

test('release build type signs with signingConfigs.release, debug keeps the debug key', () => {
  const out: string = addReleaseSigning(gradle);
  const buildTypes = out.slice(out.indexOf('buildTypes {'));
  const release = buildTypes.slice(buildTypes.indexOf('release {'));
  const debug = buildTypes.slice(buildTypes.indexOf('debug {'), buildTypes.indexOf('release {'));
  expect(release.slice(0, release.indexOf('}'))).toContain('signingConfig signingConfigs.release');
  expect(debug).toContain('signingConfig signingConfigs.debug');
});

test('is idempotent', () => {
  const once: string = addReleaseSigning(gradle);
  expect(addReleaseSigning(once)).toBe(once);
});
