import type { ConfigContext, ExpoConfig } from 'expo/config';

// WORKGO_ALLOW_HTTP=1 lets a release APK reach a plain-HTTP backend on the LAN.
// Release builds for an HTTPS server must leave it unset.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'WorkGo',
  slug: 'workgo',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'workgo',
  userInterfaceStyle: 'automatic',
  android: {
    package: 'com.workgo.app',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#1dbf73',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#1dbf73',
        image: './assets/images/splash-icon.png',
        imageWidth: 120,
      },
    ],
    'expo-secure-store',
    [
      'expo-image-picker',
      {
        cameraPermission: 'WorkGo cần camera để chụp ảnh dịch vụ và bằng chứng công việc.',
        photosPermission: 'WorkGo cần truy cập ảnh để bạn chọn ảnh tải lên.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'WorkGo dùng vị trí để gắn toạ độ vào ảnh bằng chứng công việc.',
      },
    ],
    [
      'expo-build-properties',
      { android: { usesCleartextTraffic: process.env.WORKGO_ALLOW_HTTP === '1' } },
    ],
    './plugins/withReleaseSigning',
  ],
  experiments: {
    reactCompiler: true,
  },
});
