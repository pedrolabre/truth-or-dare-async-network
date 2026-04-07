import { useState } from 'react';

export function useProfileScreen() {
  const [editVisible, setEditVisible] = useState(false);
  const [photoVisible, setPhotoVisible] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');

  function openEditModal() {
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

  function saveProfile() {
    setEditVisible(false);

    // backend futuro:
    // updateProfile({
    //   displayName,
    //   username,
    // });
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
    displayName,
    username,
    setDisplayName,
    setUsername,
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
  };
}