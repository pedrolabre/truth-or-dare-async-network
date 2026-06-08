import * as ImagePicker from 'expo-image-picker';

export type MediaPickerSource = 'camera' | 'gallery';

export type PickedImageFile = {
  localUri: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number | null;
};

export type MediaPickerErrorCode =
  | 'camera-permission-denied'
  | 'gallery-permission-denied'
  | 'file-too-large'
  | 'invalid-image'
  | 'picker-unavailable';

export class MediaPickerError extends Error {
  code: MediaPickerErrorCode;

  constructor(code: MediaPickerErrorCode, message: string) {
    super(message);
    this.name = 'MediaPickerError';
    this.code = code;
  }
}

const PROFILE_AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;

const IMAGE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
  selectionLimit: 1,
};

function getFileNameFromUri(uri: string, fallback: string) {
  const withoutQuery = uri.split('?')[0] ?? uri;
  const fileName = withoutQuery.split('/').pop()?.trim();

  return fileName || fallback;
}

function getImageMimeType(asset: ImagePicker.ImagePickerAsset, fileName: string) {
  const mimeType = asset.mimeType?.split(';')[0]?.trim().toLowerCase();

  if (mimeType) {
    return mimeType;
  }

  const source = `${fileName} ${asset.uri}`.toLowerCase();

  if (source.includes('.png')) {
    return 'image/png';
  }

  if (source.includes('.webp')) {
    return 'image/webp';
  }

  return 'image/jpeg';
}

function normalizePickedAsset(
  asset: ImagePicker.ImagePickerAsset | undefined,
  fallbackFileName: string,
): PickedImageFile {
  if (!asset?.uri?.trim()) {
    throw new MediaPickerError(
      'invalid-image',
      'Nao foi possivel usar a imagem selecionada.',
    );
  }

  if (
    typeof asset.fileSize === 'number' &&
    asset.fileSize > PROFILE_AVATAR_MAX_SIZE_BYTES
  ) {
    throw new MediaPickerError(
      'file-too-large',
      'A foto precisa ter ate 5 MB.',
    );
  }

  const fileName = asset.fileName ?? getFileNameFromUri(asset.uri, fallbackFileName);

  return {
    localUri: asset.uri,
    fileName,
    mimeType: getImageMimeType(asset, fileName),
    sizeBytes:
      typeof asset.fileSize === 'number' && Number.isFinite(asset.fileSize)
        ? asset.fileSize
        : null,
  };
}

async function requestCameraPermission() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new MediaPickerError(
      'camera-permission-denied',
      'Permita o acesso a camera para tirar uma foto de perfil.',
    );
  }
}

async function requestGalleryPermission() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new MediaPickerError(
      'gallery-permission-denied',
      'Permita o acesso a galeria para escolher uma foto de perfil.',
    );
  }
}

export async function pickImageFromCamera(): Promise<PickedImageFile | null> {
  try {
    await requestCameraPermission();

    const result = await ImagePicker.launchCameraAsync(IMAGE_PICKER_OPTIONS);

    if (result.canceled) {
      return null;
    }

    return normalizePickedAsset(result.assets[0], 'profile-avatar.jpg');
  } catch (error) {
    if (error instanceof MediaPickerError) {
      throw error;
    }

    throw new MediaPickerError(
      'picker-unavailable',
      'Nao foi possivel abrir a camera neste dispositivo.',
    );
  }
}

export async function pickImageFromGallery(): Promise<PickedImageFile | null> {
  try {
    await requestGalleryPermission();

    const result = await ImagePicker.launchImageLibraryAsync(IMAGE_PICKER_OPTIONS);

    if (result.canceled) {
      return null;
    }

    return normalizePickedAsset(result.assets[0], 'profile-avatar.jpg');
  } catch (error) {
    if (error instanceof MediaPickerError) {
      throw error;
    }

    throw new MediaPickerError(
      'picker-unavailable',
      'Nao foi possivel abrir a galeria neste dispositivo.',
    );
  }
}
