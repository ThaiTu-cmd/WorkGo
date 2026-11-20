import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { translate } from '@/i18n';

export const MAX_IMAGE_BYTES = 1_000_000;
const LONG_EDGE = 1280;
const QUALITY = 0.7;

export type PickedImage = { uri: string; capturedAt: string };

export function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export function assertImageSize(dataUrl: string): void {
  if (dataUrlBytes(dataUrl) > MAX_IMAGE_BYTES) throw new Error(translate('image.anh_qua_lon_toi_da'));
}

async function compressImage(uri: string, width: number, height: number): Promise<string> {
  const resize = width >= height ? { width: Math.min(width, LONG_EDGE) } : { height: Math.min(height, LONG_EDGE) };
  const result = await ImageManipulator.manipulateAsync(uri, [{ resize }], {
    compress: QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  assertImageSize(`data:image/jpeg;base64,${result.base64}`);
  return result.uri;
}

export async function imageFormData(uri: string): Promise<FormData> {
  const body = new FormData();
  if (Platform.OS === 'web') {
    body.append('file', await (await fetch(uri)).blob(), 'photo.jpg');
  } else {
    body.append('file', { uri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);
  }
  return body;
}

// Asks for the permission it needs at the moment of use. Returns null when the
// user cancels or refuses.
export async function pickImage(source: 'camera' | 'library'): Promise<PickedImage | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      source === 'camera' ? translate('image.chua_co_quyen_camera') : translate('image.chua_co_quyen_truy_cap'),
      translate('image.hay_cap_quyen_cho_workgo')
    );
    return null;
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  const result =
    source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const uri = await compressImage(asset.uri, asset.width, asset.height);
  return { uri, capturedAt: new Date().toISOString() };
}
