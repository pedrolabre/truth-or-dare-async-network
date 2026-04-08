import React from 'react';
import ProfileEditModal from './ProfileEditModal';
import ProfilePhotoModal from './ProfilePhotoModal';

type Props = {
  editVisible: boolean;
  photoVisible: boolean;
  displayName: string;
  username: string;
  bio: string;
  setDisplayName: (value: string) => void;
  setUsername: (value: string) => void;
  setBio: (value: string) => void;
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
  bio,
  setDisplayName,
  setUsername,
  setBio,
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
        bio={bio}
        setName={setDisplayName}
        setUsername={setUsername}
        setBio={setBio}
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