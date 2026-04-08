import { useCallback, useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile } from '../services/api';

type ProfileData = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  bio: string | null;
  createdTruthsCount: number;
  createdDaresCount: number;
};

export function useProfileScreen() {
  const [editVisible, setEditVisible] = useState(false);
  const [photoVisible, setPhotoVisible] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await getMyProfile();

      setProfile(data);
      setDisplayName(data.name);
      setUsername(data.username ?? '');
      setBio(data.bio ?? '');
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
    setPhotoVisible(true);
  }

  function closePhotoModal() {
    setPhotoVisible(false);
  }

  async function saveProfile() {
  try {
    const updated = await updateMyProfile({
      name: displayName,
      username,
      bio,
    });

    setProfile(updated);
    setDisplayName(updated.name);
    setUsername(updated.username ?? '');
    setBio(updated.bio ?? '');

    setEditVisible(false);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
  }
}

  function openCamera() {
    setPhotoVisible(false);

    // backend futuro:
    // abrir câmera / capturar imagem
    console.log('Abrir câmera em breve');
  }

  function openGallery() {
    setPhotoVisible(false);

    // backend futuro:
    // abrir galeria / selecionar imagem
    console.log('Abrir galeria em breve');
  }

  function removePhoto() {
    setPhotoVisible(false);

    // backend futuro:
    // remover foto persistida
    console.log('Remover foto em breve');
  }

  return {
    profile,
    isLoading,
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