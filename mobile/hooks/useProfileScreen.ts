import { useCallback, useEffect, useState } from 'react';
import {
  getMyProfile,
  updateMyProfile,
  type MyProfileResponse,
} from '../services/api';
import { loadCachedResource } from '../services/cachedApi';
import { LOCAL_CACHE_KEYS, LOCAL_CACHE_TTLS } from '../services/cache';
import {
  MediaPickerError,
  pickImageFromCamera,
  pickImageFromGallery,
  type PickedImageFile,
} from '../services/mediaPicker';
import { uploadAppFile } from '../services/uploads';

type ProfileData = Pick<
  MyProfileResponse,
  | 'id'
  | 'name'
  | 'email'
  | 'username'
  | 'bio'
  | 'avatarUrl'
  | 'createdTruthsCount'
  | 'createdDaresCount'
  | 'publicClubs'
>;

function getPhotoErrorMessage(error: unknown) {
  if (error instanceof MediaPickerError) {
    return error.message;
  }

  const rawMessage = error instanceof Error ? error.message : '';
  const message = rawMessage.toLowerCase();

  if (message.includes('limite') || message.includes('too large')) {
    return 'A foto precisa ter ate 5 MB.';
  }

  if (
    message.includes('contenttype') ||
    message.includes('mime') ||
    message.includes('formato')
  ) {
    return 'Use uma imagem JPG, PNG ou WebP.';
  }

  if (
    message.includes('storage') ||
    message.includes('supabase') ||
    message.includes('bucket') ||
    message.includes('upload')
  ) {
    return 'O envio de fotos esta indisponivel no momento. Tente novamente em instantes.';
  }

  if (message.includes('token') || message.includes('sessao')) {
    return 'Sua sessao expirou. Entre novamente para alterar a foto.';
  }

  return 'Nao foi possivel atualizar a foto de perfil. Tente novamente.';
}

function applyProfileFormState(
  nextProfile: ProfileData,
  setters: {
    setProfile: (profile: ProfileData) => void;
    setDisplayName: (value: string) => void;
    setUsername: (value: string) => void;
    setBio: (value: string) => void;
  },
) {
  setters.setProfile(nextProfile);
  setters.setDisplayName(nextProfile.name);
  setters.setUsername(nextProfile.username ?? '');
  setters.setBio(nextProfile.bio ?? '');
}

export function useProfileScreen() {
  const [editVisible, setEditVisible] = useState(false);
  const [photoVisible, setPhotoVisible] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoErrorMessage, setPhotoErrorMessage] = useState<string | null>(
    null,
  );
  const [photoSuccessMessage, setPhotoSuccessMessage] = useState<string | null>(
    null,
  );
  const [isFromCache, setIsFromCache] = useState(false);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setSyncErrorMessage(null);

      const result = await loadCachedResource<MyProfileResponse>({
        key: LOCAL_CACHE_KEYS.profileMe,
        ttlMs: LOCAL_CACHE_TTLS.profileMe,
        fetcher: getMyProfile,
        fallbackSyncErrorMessage:
          'Nao foi possivel sincronizar seu perfil agora.',
        onCacheHit: ({ record }) => {
          applyProfileFormState(record.value, {
            setProfile,
            setDisplayName,
            setUsername,
            setBio,
          });
          setIsFromCache(true);
          setIsLoading(false);
        },
      });

      applyProfileFormState(result.value, {
        setProfile,
        setDisplayName,
        setUsername,
        setBio,
      });
      setIsFromCache(result.isFromCache);
      setSyncErrorMessage(result.syncErrorMessage);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setProfile(null);
      setIsFromCache(false);
      setSyncErrorMessage(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function openEditModal() {
    setDisplayName(profile?.name ?? '');
    setUsername(profile?.username ?? '');
    setBio(profile?.bio ?? '');
    setEditVisible(true);
  }

  function closeEditModal() {
    setEditVisible(false);
  }

  function openPhotoModal() {
    setPhotoErrorMessage(null);
    setPhotoSuccessMessage(null);
    setPhotoVisible(true);
  }

  function closePhotoModal() {
    if (isUploadingPhoto) {
      return;
    }

    setPhotoErrorMessage(null);
    setPhotoSuccessMessage(null);
    setPhotoVisible(false);
  }

  async function saveProfile() {
    try {
      const updated = await updateMyProfile({
        name: displayName,
        username,
        bio,
      });

      applyProfileFormState(updated, {
        setProfile,
        setDisplayName,
        setUsername,
        setBio,
      });
      setIsFromCache(false);
      setSyncErrorMessage(null);

      setEditVisible(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  }

  async function uploadPickedPhoto(pickedPhoto: PickedImageFile | null) {
    if (!pickedPhoto) {
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoErrorMessage(null);
    setPhotoSuccessMessage(null);

    try {
      const uploadedPhoto = await uploadAppFile({
        localUri: pickedPhoto.localUri,
        fileName: pickedPhoto.fileName,
        mimeType: pickedPhoto.mimeType,
        usage: 'profile-avatar',
        sizeBytes: pickedPhoto.sizeBytes,
      });
      const updated = await updateMyProfile({
        avatarUrl: uploadedPhoto.fileUrl,
      });

      applyProfileFormState(updated, {
        setProfile,
        setDisplayName,
        setUsername,
        setBio,
      });
      setIsFromCache(false);
      setSyncErrorMessage(null);
      setPhotoSuccessMessage('Foto de perfil atualizada.');
    } catch (error) {
      setPhotoErrorMessage(getPhotoErrorMessage(error));
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function openCamera() {
    if (isUploadingPhoto) {
      return;
    }

    setPhotoErrorMessage(null);
    setPhotoSuccessMessage(null);

    try {
      const pickedPhoto = await pickImageFromCamera();
      await uploadPickedPhoto(pickedPhoto);
    } catch (error) {
      setPhotoErrorMessage(getPhotoErrorMessage(error));
      setIsUploadingPhoto(false);
    }
  }

  async function openGallery() {
    if (isUploadingPhoto) {
      return;
    }

    setPhotoErrorMessage(null);
    setPhotoSuccessMessage(null);

    try {
      const pickedPhoto = await pickImageFromGallery();
      await uploadPickedPhoto(pickedPhoto);
    } catch (error) {
      setPhotoErrorMessage(getPhotoErrorMessage(error));
      setIsUploadingPhoto(false);
    }
  }

  async function removePhoto() {
    if (isUploadingPhoto) {
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoErrorMessage(null);
    setPhotoSuccessMessage(null);

    try {
      const updated = await updateMyProfile({
        avatarUrl: null,
      });

      applyProfileFormState(updated, {
        setProfile,
        setDisplayName,
        setUsername,
        setBio,
      });
      setIsFromCache(false);
      setSyncErrorMessage(null);
      setPhotoSuccessMessage('Foto de perfil removida.');
    } catch (error) {
      setPhotoErrorMessage(getPhotoErrorMessage(error));
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  return {
    profile,
    isLoading,
    isFromCache,
    syncErrorMessage,
    isUploadingPhoto,
    photoErrorMessage,
    photoSuccessMessage,
    displayName,
    username,
    bio,
    setDisplayName,
    setUsername,
    setBio,
    editVisible,
    photoVisible,
    openEditModal,
    closeEditModal,
    openPhotoModal,
    closePhotoModal,
    saveProfile,
    openCamera,
    openGallery,
    removePhoto,
    loadProfile,
  };
}
