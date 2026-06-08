import * as ImagePicker from 'expo-image-picker';

export type MediaPickerSource = 'camera' | 'gallery';

export type PickedImageFile = {
  localUri: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number | null;
};

export type MediaPickerImageOptions = {
  fallbackFileName?: string;
  maxSizeBytes?: number;
  fileTooLargeMessage?: string;
  cameraPermissionMessage?: string;
  galleryPermissionMessage?: string;
  aspect?: [number, number];
  allowsEditing?: boolean;
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
const CLUB_AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const CLUB_COVER_MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const CLUB_AVATAR_PICKER_OPTIONS: MediaPickerImageOptions = {
  fallbackFileName: 'club-avatar.jpg',
  maxSizeBytes: CLUB_AVATAR_MAX_SIZE_BYTES,
  fileTooLargeMessage: 'O avatar do clube precisa ter ate 5 MB.',
  cameraPermissionMessage:
    'Permita o acesso a camera para tirar um avatar do clube.',
  galleryPermissionMessage:
    'Permita o acesso a galeria para escolher um avatar do clube.',
  aspect: [1, 1],
};

export const CLUB_COVER_PICKER_OPTIONS: MediaPickerImageOptions = {
  fallbackFileName: 'club-cover.jpg',
  maxSizeBytes: CLUB_COVER_MAX_SIZE_BYTES,
  fileTooLargeMessage: 'A capa do clube precisa ter ate 10 MB.',
  cameraPermissionMessage:
    'Permita o acesso a camera para tirar uma capa do clube.',
  galleryPermissionMessage:
    'Permita o acesso a galeria para escolher uma capa do clube.',
  aspect: [16, 9],
};

const PROFILE_AVATAR_PICKER_OPTIONS: Required<MediaPickerImageOptions> = {
  fallbackFileName: 'profile-avatar.jpg',
  maxSizeBytes: PROFILE_AVATAR_MAX_SIZE_BYTES,
  fileTooLargeMessage: 'A foto precisa ter ate 5 MB.',
  cameraPermissionMessage:
    'Permita o acesso a camera para tirar uma foto de perfil.',
  galleryPermissionMessage:
    'Permita o acesso a galeria para escolher uma foto de perfil.',
  aspect: [1, 1],
  allowsEditing: true,
};

function getImagePickerOptions(
  options: Required<MediaPickerImageOptions>,
): ImagePicker.ImagePickerOptions {
  return {
    mediaTypes: ['images'],
    allowsEditing: options.allowsEditing,
    aspect: options.aspect,
    quality: 0.85,
    selectionLimit: 1,
  };
}

function normalizePickerOptions(
  options: MediaPickerImageOptions = {},
): Required<MediaPickerImageOptions> {
  return {
    ...PROFILE_AVATAR_PICKER_OPTIONS,
    ...options,
    aspect: options.aspect ?? PROFILE_AVATAR_PICKER_OPTIONS.aspect,
    allowsEditing:
      options.allowsEditing ?? PROFILE_AVATAR_PICKER_OPTIONS.allowsEditing,
  };
}

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
  options: Required<MediaPickerImageOptions>,
): PickedImageFile {
  if (!asset?.uri?.trim()) {
    throw new MediaPickerError(
      'invalid-image',
      'Nao foi possivel usar a imagem selecionada.',
    );
  }

  if (
    typeof asset.fileSize === 'number' &&
    asset.fileSize > options.maxSizeBytes
  ) {
    throw new MediaPickerError(
      'file-too-large',
      options.fileTooLargeMessage,
    );
  }

  const fileName =
    asset.fileName ?? getFileNameFromUri(asset.uri, options.fallbackFileName);

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

async function requestCameraPermission(message: string) {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new MediaPickerError('camera-permission-denied', message);
  }
}

async function requestGalleryPermission(message: string) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new MediaPickerError('gallery-permission-denied', message);
  }
}

export async function pickImageFromCamera(
  pickerOptions?: MediaPickerImageOptions,
): Promise<PickedImageFile | null> {
  const options = normalizePickerOptions(pickerOptions);

  try {
    await requestCameraPermission(options.cameraPermissionMessage);

    const result = await ImagePicker.launchCameraAsync(
      getImagePickerOptions(options),
    );

    if (result.canceled) {
      return null;
    }

    return normalizePickedAsset(result.assets[0], options);
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

export async function pickImageFromGallery(
  pickerOptions?: MediaPickerImageOptions,
): Promise<PickedImageFile | null> {
  const options = normalizePickerOptions(pickerOptions);

  try {
    await requestGalleryPermission(options.galleryPermissionMessage);

    const result = await ImagePicker.launchImageLibraryAsync(
      getImagePickerOptions(options),
    );

    if (result.canceled) {
      return null;
    }

    return normalizePickedAsset(result.assets[0], options);
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
