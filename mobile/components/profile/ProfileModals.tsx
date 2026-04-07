import React from 'react';
import ProfileEditModal from './ProfileEditModal';
import ProfilePhotoModal from './ProfilePhotoModal';

type Props = {
  editVisible: boolean;
  photoVisible: boolean;
  displayName: string;
  username: string;
  setDisplayName: (value: string) => void;
  setUsername: (value: string) => void;
  onCloseEdit: () => void;
  onSaveProfile: () => void;
  onClosePhoto: () => void;
  onOpenCamera: () => void;
  onOpenGallery: () => void;
  onRemovePhoto: () => void;
};

export default function ProfileModals({
  editVisible,
  photoVisible,
  displayName,
  username,
  setDisplayName,
  setUsername,
  onCloseEdit,
  onSaveProfile,
  onClosePhoto,
  onOpenCamera,
  onOpenGallery,
  onRemovePhoto,
}: Props) {
  return (
    <>
      <ProfileEditModal
        visible={editVisible}
        onClose={onCloseEdit}
        onSave={onSaveProfile}
        name={displayName}
        username={username}
        setName={setDisplayName}
        setUsername={setUsername}
      />

      <ProfilePhotoModal
        visible={photoVisible}
        onClose={onClosePhoto}
        onCamera={onOpenCamera}
        onGallery={onOpenGallery}
        onRemove={onRemovePhoto}
      />
    </>
  );
}