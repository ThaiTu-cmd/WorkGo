// Config plugin: sign release builds with the WorkGo upload key instead of the
// debug key. The keystore lives outside the repo; its path and passwords come
// from ~/.gradle/gradle.properties (WORKGO_UPLOAD_*), see README.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// workgo-release-signing';

const RELEASE_SIGNING = `        release { ${MARKER}
            if (project.hasProperty('WORKGO_UPLOAD_STORE_FILE')) {
                storeFile file(WORKGO_UPLOAD_STORE_FILE)
                storePassword WORKGO_UPLOAD_STORE_PASSWORD
                keyAlias WORKGO_UPLOAD_KEY_ALIAS
                keyPassword WORKGO_UPLOAD_KEY_PASSWORD
            }
        }
`;

function addReleaseSigning(gradle) {
  if (gradle.includes(MARKER)) return gradle;

  // 1. A release entry inside signingConfigs { ... }, after the debug one.
  const signingStart = gradle.indexOf('signingConfigs {');
  const buildTypesStart = gradle.indexOf('buildTypes {');
  if (signingStart < 0 || buildTypesStart < 0) throw new Error('withReleaseSigning: unexpected build.gradle layout');
  const signingEnd = gradle.lastIndexOf('}', buildTypesStart);
  let out = gradle.slice(0, signingEnd) + RELEASE_SIGNING.trimEnd().replace(/^ {4}/, '') + '\n    ' + gradle.slice(signingEnd);

  // 2. The release build type uses it.
  const typesStart = out.indexOf('buildTypes {');
  const releaseStart = out.indexOf('release {', typesStart);
  const line = 'signingConfig signingConfigs.debug';
  const lineAt = out.indexOf(line, releaseStart);
  if (releaseStart < 0 || lineAt < 0) throw new Error('withReleaseSigning: release build type not found');
  out = out.slice(0, lineAt) + 'signingConfig signingConfigs.release' + out.slice(lineAt + line.length);
  return out;
}

const withReleaseSigning = (config) =>
  withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = addReleaseSigning(cfg.modResults.contents);
    return cfg;
  });

module.exports = withReleaseSigning;
module.exports.addReleaseSigning = addReleaseSigning;
