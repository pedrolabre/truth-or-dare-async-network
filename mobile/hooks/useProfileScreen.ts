import { useCallback, useEffect, useState } from 'react';
import {
  getMyProfile,
  updateMyProfile,
  type MyProfileResponse,
} from '../services/api';
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

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await getMyProfile();

      applyProfileFormState(data, {
        setProfile,
        setDisplayName,
        setUsername,
        setBio,
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setProfile(null);
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
