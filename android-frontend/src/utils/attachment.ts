import * as DocumentPicker from 'expo-document-picker';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB

export interface SelectedAttachment {
  name: string;
  size?: number;
  mimeType?: string;
  uri?: string;
}

export interface AttachmentPickResult {
  success: boolean;
  file?: SelectedAttachment;
  error?: string;
  canceled?: boolean;
}

export async function pickAttachment(): Promise<AttachmentPickResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    if (!result.assets || result.assets.length === 0) {
      return { success: false, canceled: true };
    }

    const asset = result.assets[0];

    // Validate MIME type
    if (asset.mimeType && !(ALLOWED_MIME_TYPES as readonly string[]).includes(asset.mimeType)) {
      return {
        success: false,
        error: 'Định dạng tệp không được hỗ trợ. Chỉ chấp nhận PDF, JPG, PNG.',
      };
    }

    // Validate file size (10MB)
    if (asset.size && asset.size > MAX_ATTACHMENT_SIZE) {
      return {
        success: false,
        error: 'Kích thước tệp vượt quá giới hạn 10MB.',
      };
    }

    return {
      success: true,
      file: {
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
        uri: asset.uri,
      },
    };
  } catch {
    // If native picker fails or is unsupported in environment
    return {
      success: false,
      error: 'Không thể mở trình chọn tệp trên thiết bị này.',
    };
  }
}
