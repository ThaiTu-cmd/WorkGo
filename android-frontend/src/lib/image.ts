import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

// There is no upload service: images travel as JPEG data URLs inside the
// JSON body (work evidence fileUrl, service media url), like the web app.
export const MAX_IMAGE_BYTES = 1_000_000;
const LONG_EDGE = 1280;
const QUALITY = 0.7;

export type PickedImage = { dataUrl: string; capturedAt: string };

export function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export function assertImageSize(dataUrl: string): void {
  if (dataUrlBytes(dataUrl) > MAX_IMAGE_BYTES) throw new Error('Ảnh quá lớn (tối đa 1MB). Hãy chọn ảnh khác.');
}

export async function compressToDataUrl(uri: string, width: number, height: number): Promise<string> {
  const resize = width >= height ? { width: Math.min(width, LONG_EDGE) } : { height: Math.min(height, LONG_EDGE) };
  const result = await ImageManipulator.manipulateAsync(uri, [{ resize }], {
    compress: QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  return `data:image/jpeg;base64,${result.base64}`;
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
      source === 'camera' ? 'Chưa có quyền camera' : 'Chưa có quyền truy cập ảnh',
      'Hãy cấp quyền cho WorkGo trong Cài đặt của điện thoại rồi thử lại.'
    );
    return null;
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  const result =
    source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const dataUrl = await compressToDataUrl(asset.uri, asset.width, asset.height);
  assertImageSize(dataUrl);
  return { dataUrl, capturedAt: new Date().toISOString() };
}
