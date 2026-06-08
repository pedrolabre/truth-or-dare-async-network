import React from 'react';
import { act, render, renderHook, waitFor } from '@testing-library/react-native';

import PublicProfileScreen from '../app/profile/[id]';
import { useProfileScreen } from '../hooks/useProfileScreen';
import {
  getMyProfile,
  getPublicUserProfile,
  updateMyProfile,
} from '../services/api';
import {
  MediaPickerError,
  pickImageFromCamera,
  pickImageFromGallery,
} from '../services/mediaPicker';
import { uploadAppFile } from '../services/uploads';
import type { MyProfileResponse } from '../services/api';
import type { PublicUserProfile } from '../types/user';

const mockRouterBack = jest.fn();
const mockRouterPush = jest.fn();
const mockUseLocalSearchParams = jest.fn();

jest.mock('react-native/Libraries/Image/Image', () => ({
  __esModule: true,
  default: 'Image',
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    MaterialIcons: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({
    back: mockRouterBack,
    push: mockRouterPush,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
}));

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock('../services/api', () => ({
  getMyProfile: jest.fn(),
  getPublicUserProfile: jest.fn(),
  updateMyProfile: jest.fn(),
}));

jest.mock('../services/uploads', () => ({
  uploadAppFile: jest.fn(),
}));

jest.mock('../services/mediaPicker', () => {
  const actual = jest.requireActual('../services/mediaPicker');

  return {
    ...actual,
    pickImageFromCamera: jest.fn(),
    pickImageFromGallery: jest.fn(),
  };
});

const mockedGetMyProfile = getMyProfile as jest.MockedFunction<
  typeof getMyProfile
>;
const mockedGetPublicUserProfile =
  getPublicUserProfile as jest.MockedFunction<typeof getPublicUserProfile>;
const mockedUpdateMyProfile = updateMyProfile as jest.MockedFunction<
  typeof updateMyProfile
>;
const mockedUploadAppFile = uploadAppFile as jest.MockedFunction<
  typeof uploadAppFile
>;
const mockedPickImageFromCamera =
  pickImageFromCamera as jest.MockedFunction<typeof pickImageFromCamera>;
const mockedPickImageFromGallery =
  pickImageFromGallery as jest.MockedFunction<typeof pickImageFromGallery>;

function makeProfile(
  overrides: Partial<MyProfileResponse> = {},
): MyProfileResponse {
  return {
    id: 'user-1',
    name: 'Marina Perfil',
    email: 'marina@test.com',
    username: 'marina_perfil',
    bio: 'Bio atual.',
    avatarUrl: null,
    isPrivate: false,
    createdAt: '2026-06-01T12:00:00.000Z',
    createdTruthsCount: 2,
    createdDaresCount: 3,
    stats: {
      createdTruthsCount: 2,
      createdDaresCount: 3,
      activePublicClubsCount: 1,
      publishedClubPromptsCount: 4,
    },
    ...overrides,
  };
}

function makePublicProfile(
  overrides: Partial<PublicUserProfile> = {},
): PublicUserProfile {
  return {
    id: 'public-user-1',
    name: 'Ana Publica',
    username: 'ana_publica',
    bio: 'Perfil com avatar real.',
    avatarUrl: 'https://cdn.example.com/public-avatar.jpg',
    level: 5,
    levelLabel: 'Nivel 5',
    stats: {
      createdTruthsCount: 1,
      createdDaresCount: 2,
      activePublicClubsCount: 3,
      publishedClubPromptsCount: 4,
    },
    ...overrides,
  };
}

async function renderLoadedProfileHook(
  profile: MyProfileResponse = makeProfile(),
) {
  mockedGetMyProfile.mockResolvedValue(profile);

  const hook = renderHook(() => useProfileScreen());

  await waitFor(() => {
    expect(hook.result.current.isLoading).toBe(false);
  });

  return hook;
}

describe('profile avatar flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({
      id: 'public-user-1',
    });
  });

  it('envia foto capturada como profile-avatar e atualiza avatarUrl do perfil', async () => {
    const hook = await renderLoadedProfileHook();

    mockedPickImageFromCamera.mockResolvedValue({
      localUri: 'file:///avatar.jpg',
      fileName: 'avatar.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1234,
    });
    mockedUploadAppFile.mockResolvedValue({
      bucket: 'uploads',
      path: 'profile-avatars/user-1/avatar.jpg',
      fileUrl: 'https://cdn.example.com/avatar.jpg',
    });
    mockedUpdateMyProfile.mockResolvedValue(
      makeProfile({
        avatarUrl: 'https://cdn.example.com/avatar.jpg',
      }),
    );

    await act(async () => {
      await hook.result.current.openCamera();
    });

    expect(mockedUploadAppFile).toHaveBeenCalledWith({
      localUri: 'file:///avatar.jpg',
      fileName: 'avatar.jpg',
      mimeType: 'image/jpeg',
      usage: 'profile-avatar',
      sizeBytes: 1234,
    });
    expect(mockedUpdateMyProfile).toHaveBeenCalledWith({
      avatarUrl: 'https://cdn.example.com/avatar.jpg',
    });
    expect(hook.result.current.profile?.avatarUrl).toBe(
      'https://cdn.example.com/avatar.jpg',
    );
    expect(hook.result.current.photoSuccessMessage).toBe(
      'Foto de perfil atualizada.',
    );
  });

  it('mostra erro amigavel de permissao da galeria sem iniciar upload', async () => {
    const hook = await renderLoadedProfileHook();

    mockedPickImageFromGallery.mockRejectedValue(
      new MediaPickerError(
        'gallery-permission-denied',
        'Permita o acesso a galeria para escolher uma foto de perfil.',
      ),
    );

    await act(async () => {
      await hook.result.current.openGallery();
    });

    expect(hook.result.current.photoErrorMessage).toBe(
      'Permita o acesso a galeria para escolher uma foto de perfil.',
    );
    expect(mockedUploadAppFile).not.toHaveBeenCalled();
    expect(mockedUpdateMyProfile).not.toHaveBeenCalled();
  });

  it('sanitiza falha de Storage e permite tentar upload novamente', async () => {
    const hook = await renderLoadedProfileHook();

    mockedPickImageFromCamera.mockResolvedValue({
      localUri: 'file:///avatar.png',
      fileName: 'avatar.png',
      mimeType: 'image/png',
      sizeBytes: 2048,
    });
    mockedUploadAppFile.mockRejectedValueOnce(
      new Error('Storage falhou com detalhe tecnico sensivel bruto.'),
    );

    await act(async () => {
      await hook.result.current.openCamera();
    });

    expect(hook.result.current.photoErrorMessage).toBe(
      'O envio de fotos esta indisponivel no momento. Tente novamente em instantes.',
    );
    expect(hook.result.current.photoErrorMessage).not.toContain(
      'detalhe tecnico sensivel bruto',
    );

    mockedUploadAppFile.mockResolvedValueOnce({
      bucket: 'uploads',
      path: 'profile-avatars/user-1/avatar.png',
      fileUrl: 'https://cdn.example.com/retry-avatar.png',
    });
    mockedUpdateMyProfile.mockResolvedValueOnce(
      makeProfile({
        avatarUrl: 'https://cdn.example.com/retry-avatar.png',
      }),
    );

    await act(async () => {
      await hook.result.current.openCamera();
    });

    expect(hook.result.current.photoErrorMessage).toBeNull();
    expect(hook.result.current.photoSuccessMessage).toBe(
      'Foto de perfil atualizada.',
    );
    expect(mockedUploadAppFile).toHaveBeenCalledTimes(2);
  });

  it('remove foto persistindo avatarUrl nulo', async () => {
    const hook = await renderLoadedProfileHook(
      makeProfile({
        avatarUrl: 'https://cdn.example.com/current-avatar.jpg',
      }),
    );

    mockedUpdateMyProfile.mockResolvedValue(
      makeProfile({
        avatarUrl: null,
      }),
    );

    await act(async () => {
      await hook.result.current.removePhoto();
    });

    expect(mockedUpdateMyProfile).toHaveBeenCalledWith({
      avatarUrl: null,
    });
    expect(hook.result.current.profile?.avatarUrl).toBeNull();
    expect(hook.result.current.photoSuccessMessage).toBe(
      'Foto de perfil removida.',
    );
  });

  it('renderiza avatar publico real quando a API permite', async () => {
    mockedGetPublicUserProfile.mockResolvedValue(makePublicProfile());

    const { getByLabelText } = render(<PublicProfileScreen />);

    await waitFor(() => {
      expect(getByLabelText('Foto de perfil de Ana Publica')).toBeTruthy();
    });
  });
});
